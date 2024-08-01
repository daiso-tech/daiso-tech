import { isIterable } from "../../../helpers";
import {
    CollectionError,
    type Comparator,
    type Filter,
    type FindOrSettings,
    type FindSettings,
    type ForEach,
    type GroupBySettings,
    InvalidTypeError,
    ItemNotFoundError,
    type JoinSettings,
    type Lazyable,
    type Map,
    type Modifier,
    MultipleItemsFoundError,
    NumberOverflowError,
    NumberUnderflowError,
    type PageSettings,
    type RecordItem,
    type ReduceSettings,
    type ReverseSettings,
    type Tap,
    type Transform,
    UnexpectedCollectionError,
    type UpdatedItem,
} from "../../../shared";
import { type Collapse, type ICollection } from "../../collection.contract";

/**
 * Most methods in IterableCollection are lazy and will only execute when calling methods return values or iterating through an IterableCollection by using for of loop.
 */
export class IterableCollection<TInput> implements ICollection<TInput> {
    private static THROW_ON_NUMBER_LIMIT = false;

    private static DEFAULT_CHUNK_SIZE = 1024;

    constructor(private iterable: Iterable<TInput>) {}

    *[Symbol.iterator](): Iterator<TInput> {
        try {
            yield* this.iterable;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    iterator(): Iterator<TInput, void> {
        return this[Symbol.iterator]() as Iterator<TInput, void>;
    }

    filter<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TOutput> {
        return new IterableCollection<TOutput>(
            new IterableCollection.FilterIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static FilterIterable = class<TInput, TOutput extends TInput>
        implements Iterable<TOutput>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>, TOutput>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TOutput> {
            try {
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (this.filter(item, index, this.collection)) {
                        yield item as TOutput;
                    }
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    map<TOutput>(
        map: Map<TInput, ICollection<TInput>, TOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TOutput> {
        return new IterableCollection(
            new IterableCollection.MapIterable(this, map, throwOnNumberLimit),
        );
    }

    private static MapIterable = class<TInput, TOutput>
        implements Iterable<TOutput>
    {
        constructor(
            private collection: ICollection<TInput>,
            private map: Map<TInput, ICollection<TInput>, TOutput>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TOutput> {
            try {
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    yield this.map(item, index, this.collection);
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    reduce<TOutput = TInput>(
        settings: ReduceSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const { reduce, initialValue, throwOnNumberLimit } = settings;
        if (initialValue === undefined && this.empty()) {
            throw new InvalidTypeError(
                "Reduce of empty array must be inputed a initial value",
            );
        }
        if (initialValue !== undefined) {
            let output = initialValue as TOutput;
            let index = 0;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                output = reduce(output, item, index, this);
                index++;
            }
            return output;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let output: TOutput = this.firstOrFail() as any;
        let index = 0;
        let isFirstIteration = true;
        for (const item of this) {
            if (!isFirstIteration) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                output = reduce(output, item, index, this);
            }
            isFirstIteration = false;
            index++;
        }
        return output;
    }

    join(settings?: JoinSettings): string {
        return this.reduce({
            reduce(str, item) {
                if (typeof item !== "string") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be string",
                    );
                }
                const separator = settings?.seperator ?? ",";
                return str + separator + item;
            },
            throwOnNumberLimit:
                settings?.throwOnNumberLimit ??
                IterableCollection.THROW_ON_NUMBER_LIMIT,
        });
    }

    collapse(): ICollection<Collapse<TInput>> {
        return new IterableCollection(
            new IterableCollection.CollapseIterable(this),
        );
    }

    private static CollapseIterable = class<TInput>
        implements Iterable<Collapse<TInput>>
    {
        constructor(private collection: ICollection<TInput>) {}

        *[Symbol.iterator](): Iterator<Collapse<TInput>> {
            try {
                for (const item of this.collection) {
                    if (isIterable<TInput>(item)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        yield* item as any;
                    } else {
                        yield item as Collapse<TInput>;
                    }
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    flatMap<TOutput>(
        map: Map<TInput, ICollection<TInput>, Iterable<TOutput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TOutput> {
        return new IterableCollection(
            new IterableCollection.FlatMapIterable(
                this,
                map,
                throwOnNumberLimit,
            ),
        );
    }

    private static FlatMapIterable = class<TInput, TOutput>
        implements Iterable<TOutput>
    {
        constructor(
            private collection: ICollection<TInput>,
            private map: Map<TInput, ICollection<TInput>, Iterable<TOutput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TOutput> {
            try {
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    yield* this.map(item, index, this.collection);
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    update<TFilterOutput extends TInput, TMapOutput>(
        filter: Filter<TInput, ICollection<TInput>, TFilterOutput>,
        map: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<UpdatedItem<TInput, TFilterOutput, TMapOutput>> {
        return new IterableCollection(
            new IterableCollection.UpdateIterable(
                this,
                filter,
                map,
                throwOnNumberLimit,
            ),
        );
    }

    private static UpdateIterable = class<
        TInput,
        TFilterOutput extends TInput,
        TMapOutput,
    > implements Iterable<UpdatedItem<TInput, TFilterOutput, TMapOutput>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>, TFilterOutput>,
            private map: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<
            UpdatedItem<TInput, TFilterOutput, TMapOutput>
        > {
            try {
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (this.filter(item, index, this.collection)) {
                        yield this.map(
                            item as TFilterOutput,
                            index,
                            this.collection,
                        );
                    } else {
                        yield item;
                    }
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    page(settings: PageSettings): ICollection<TInput> {
        const { page, pageSize, throwOnNumberLimit } = settings;
        if (page < 0) {
            return this.skip(page * pageSize, throwOnNumberLimit).take(
                pageSize,
                throwOnNumberLimit,
            );
        }
        return this.skip((page - 1) * pageSize, throwOnNumberLimit).take(
            page * pageSize,
            throwOnNumberLimit,
        );
    }

    sum(throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT): number {
        try {
            let sum = 0;
            for (const item of this) {
                if (throwOnNumberLimit && sum === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Sum has overflowed");
                }
                if (typeof item !== "number") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be number",
                    );
                }
                if (throwOnNumberLimit && sum >= 0) {
                    const difference = Number.MAX_VALUE - sum;
                    if (difference < item) {
                        throw new NumberOverflowError("Sum has overflowed");
                    }
                } else if (throwOnNumberLimit) {
                    const difference = Number.MIN_VALUE + sum;
                    if (difference > item) {
                        throw new NumberUnderflowError("Sum has undefflowed");
                    }
                }
                sum = sum + item;
            }
            return sum;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    average(
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): number {
        try {
            let size = 0;
            let sum = 0;
            for (const item of this) {
                if (throwOnNumberLimit && sum === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("The sum has overflowed");
                }
                if (throwOnNumberLimit && size === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("The size has overflowed");
                }
                if (typeof item !== "number") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be number",
                    );
                }
                if (throwOnNumberLimit && sum >= 0) {
                    const difference = Number.MAX_VALUE - sum;
                    if (difference < item) {
                        throw new NumberOverflowError("The sum has overflowed");
                    }
                } else if (throwOnNumberLimit) {
                    const difference = Number.MIN_VALUE + sum;
                    if (difference > item) {
                        throw new NumberUnderflowError(
                            "The sum has underflowed",
                        );
                    }
                }
                size++;
                sum = sum + item;
            }
            return sum / size;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    median(
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): number {
        if (this.empty()) {
            return 0;
        }
        const size = this.size(throwOnNumberLimit);
        if (size === 0) {
            return 0;
        }
        const isEven = size % 2 === 0;
        const items = this.map((item) => {
            if (typeof item !== "number") {
                throw new InvalidTypeError(
                    "Item type is invalid must be number",
                );
            }
            return item;
        }, throwOnNumberLimit)
            .filter((_item, index) => {
                if (isEven) {
                    return index === size / 2 || index === size / 2 - 1;
                }
                return index === Math.floor(size / 2);
            }, throwOnNumberLimit)

            .toArray();
        if (isEven) {
            const [a, b] = items;
            if (a === undefined) {
                throw new UnexpectedCollectionError("Is in invalid state");
            }
            if (b === undefined) {
                throw new UnexpectedCollectionError("Is in invalid state");
            }
            return (a + b) / 2;
        }
        const [median] = items;
        if (median === undefined) {
            throw new UnexpectedCollectionError("Is in invalid state");
        }
        return median;
    }

    min(): number {
        try {
            let min = 0;
            for (const item of this) {
                if (typeof item !== "number") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be number",
                    );
                }
                if (min === 0) {
                    min = item;
                } else if (min > item) {
                    min = item;
                }
            }
            return min;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    max(): number {
        try {
            let max = 0;
            for (const item of this) {
                if (typeof item !== "number") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be number",
                    );
                }
                if (max === 0) {
                    max = item;
                } else if (max < item) {
                    max = item;
                }
            }
            return max;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    sumBigint(): bigint {
        try {
            let sum = 0n;
            for (const item of this) {
                if (typeof item !== "bigint") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be bigint",
                    );
                }
                sum = sum + item;
            }
            return sum;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    averageBigint(): bigint {
        try {
            let index = 0n;
            let sum = 0n;
            for (const item of this) {
                if (typeof item !== "bigint") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be bigint",
                    );
                }
                index++;
                sum = sum + item;
            }
            return sum / index;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    medianBigint(
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): bigint {
        if (this.empty()) {
            return 0n;
        }
        const size = this.size(throwOnNumberLimit);
        if (size === 0) {
            return 0n;
        }
        const isEven = size % 2 === 0;
        const items = this.map((item) => {
            if (typeof item !== "bigint") {
                throw new InvalidTypeError(
                    "Item type is invalid must be bigint",
                );
            }
            return item;
        }, throwOnNumberLimit)
            .filter((_item, index) => {
                if (isEven) {
                    return index === size / 2 || index === size / 2 - 1;
                }
                return index === Math.floor(size / 2);
            }, throwOnNumberLimit)

            .toArray();
        if (isEven) {
            const [a, b] = items;
            if (a === undefined) {
                throw new UnexpectedCollectionError("Is invalid state");
            }
            if (b === undefined) {
                throw new UnexpectedCollectionError("Is invalid state");
            }
            return (a + b) / 2n;
        }
        const [median] = items;
        if (median === undefined) {
            throw new UnexpectedCollectionError("Is invalid state");
        }
        return median;
    }

    minBigint(): bigint {
        try {
            let min = 0n;
            for (const item of this) {
                if (typeof item !== "bigint") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be bigint",
                    );
                }
                if (min === 0n) {
                    min = item;
                } else if (min > item) {
                    min = item;
                }
            }
            return min;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    maxBigint(): bigint {
        try {
            let max = 0n;
            for (const item of this) {
                if (typeof item !== "bigint") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be bigint",
                    );
                }
                if (max === 0n) {
                    max = item;
                } else if (max < item) {
                    max = item;
                }
            }
            return max;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    percentage(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): number {
        try {
            if (this.empty()) {
                return 0;
            }
            let total = 0;
            let part = 0;
            for (const item of this) {
                if (throwOnNumberLimit && total === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError(
                        "The total amount has overflowed",
                    );
                }
                if (filter(item, total, this)) {
                    part++;
                }
                total++;
            }
            return (part / total) * 100;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    some<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): boolean {
        try {
            let index = 0;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (filter(item, index, this)) {
                    return true;
                }
                index++;
            }
            return false;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    every<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): boolean {
        try {
            let index = 0;
            let isTrue = true;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                isTrue = isTrue && filter(item, index, this);
                if (!isTrue) {
                    break;
                }
                index++;
            }
            return isTrue;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    take(
        limit: number,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.TakeIterable(
                this,
                limit,
                throwOnNumberLimit,
            ),
        );
    }

    private static TakeIterable = class<TInput> implements Iterable<TInput> {
        constructor(
            private collection: ICollection<TInput>,
            private limit: number,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            try {
                if (this.limit < 0) {
                    this.limit =
                        this.collection.size(this.throwOnNumberLimit) +
                        this.limit;
                }
                yield* this.collection.takeWhile(
                    (_item, index) => index < this.limit,
                    this.throwOnNumberLimit,
                );
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    takeUntil(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.TakeUntilIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static TakeUntilIterable = class<TInput>
        implements Iterable<TInput>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            try {
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (this.filter(item, index, this.collection)) {
                        break;
                    }
                    yield item;
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    takeWhile(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput> {
        return this.takeUntil(
            (...arguments_) => !filter(...arguments_),
            throwOnNumberLimit,
        );
    }

    skip(
        offset: number,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.SkipIterable(
                this,
                offset,
                throwOnNumberLimit,
            ),
        );
    }

    private static SkipIterable = class<TInput> implements Iterable<TInput> {
        constructor(
            private collection: ICollection<TInput>,
            private offset: number,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            try {
                if (this.offset < 0) {
                    this.offset =
                        this.collection.size(this.throwOnNumberLimit) +
                        this.offset;
                }
                yield* this.collection.skipWhile(
                    (_item, index) => index < this.offset,
                    this.throwOnNumberLimit,
                );
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    skipUntil(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.SkipUntilIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static SkipUntilIterable = class<TInput>
        implements Iterable<TInput>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            try {
                let index = 0;
                let hasMatched = false;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (!hasMatched) {
                        hasMatched = this.filter(item, index, this.collection);
                    }
                    if (hasMatched) {
                        yield item;
                    }
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    skipWhile<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput> {
        return this.skipUntil(
            (...arguments_) => !filter(...arguments_),
            throwOnNumberLimit,
        );
    }

    when<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.WhenIterable(
                this,
                () => condition,
                callback,
            ),
        );
    }

    whenEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.WhenIterable(
                this,
                () => this.empty(),
                callback,
            ),
        );
    }

    whenNot<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return this.when(!condition, callback);
    }

    whenNotEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.WhenIterable(
                this,
                () => this.notEmpty(),
                callback,
            ),
        );
    }

    private static WhenIterable = class<TInput, TExtended>
        implements Iterable<TInput | TExtended>
    {
        constructor(
            private collection: ICollection<TInput>,
            private condition: () => boolean,
            private callback: Modifier<
                ICollection<TInput>,
                ICollection<TExtended>
            >,
        ) {}

        *[Symbol.iterator](): Iterator<TInput | TExtended> {
            try {
                if (this.condition()) {
                    yield* this.callback(this.collection);
                    return;
                }
                yield* this.collection as ICollection<TInput | TExtended>;
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    pipe<TOutput = TInput>(
        callback: Transform<ICollection<TInput>, TOutput>,
    ): TOutput {
        try {
            return callback(this);
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    tap(callback: Tap<ICollection<TInput>>): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.TapIterable(this, callback),
        );
    }

    private static TapIterable = class<TInput> implements Iterable<TInput> {
        constructor(
            private collection: ICollection<TInput>,
            private callback: Tap<ICollection<TInput>>,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            try {
                this.callback(this.collection);
                yield* this.collection;
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    chunk(chunkSize: number): ICollection<ICollection<TInput>> {
        return new IterableCollection(
            new IterableCollection.ChunkIterable(this, chunkSize),
        );
    }

    private static ChunkIterable = class<TInput>
        implements Iterable<ICollection<TInput>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private chunkSize: number,
        ) {}

        *[Symbol.iterator](): Iterator<ICollection<TInput>> {
            try {
                let chunk: ICollection<TInput> = new IterableCollection<TInput>(
                    [],
                );
                let currentChunkSize = 0;
                let isFirstIteration = true;
                for (const item of this.collection) {
                    currentChunkSize = currentChunkSize % this.chunkSize;
                    const isFilled = currentChunkSize === 0;
                    if (!isFirstIteration && isFilled) {
                        yield chunk;
                        chunk = new IterableCollection<TInput>([]);
                    }
                    chunk = chunk.append([item]);
                    currentChunkSize++;
                    isFirstIteration = false;
                }
                const hasRest = currentChunkSize !== 0;
                if (hasRest) {
                    yield chunk;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    chunkWhile(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<ICollection<TInput>> {
        return new IterableCollection(
            new IterableCollection.ChunkWhileIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static ChunkWhileIterable = class<TInput>
        implements Iterable<ICollection<TInput>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<ICollection<TInput>> {
            try {
                let index = 0;
                let collection: ICollection<TInput> =
                    new IterableCollection<TInput>([]);
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (index === 0) {
                        collection = collection.append([item]);
                    } else if (this.filter(item, index, collection)) {
                        collection = collection.append([item]);
                    } else {
                        yield collection;
                        collection = new IterableCollection<TInput>([item]);
                    }
                    index++;
                }
                yield collection;
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    split(
        chunkAmount: number,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<ICollection<TInput>> {
        return new IterableCollection(
            new IterableCollection.SplitIterable(
                this,
                chunkAmount,
                throwOnNumberLimit,
            ),
        );
    }

    private static SplitIterable = class<TInput>
        implements Iterable<ICollection<TInput>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private chunkAmount: number,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<ICollection<TInput>> {
            try {
                const size = this.collection.size(this.throwOnNumberLimit);
                const minChunkSize = Math.floor(size / this.chunkAmount);
                const restSize = size % this.chunkAmount;
                const chunkSizes = Array.from<number>({
                    length: this.chunkAmount,
                }).fill(minChunkSize);

                for (let i = 1; i <= restSize; i++) {
                    const chunkIndex = (i - 1) % this.chunkAmount;
                    if (chunkSizes[chunkIndex]) {
                        chunkSizes[chunkIndex] = chunkSizes[chunkIndex] + 1;
                    }
                }

                const iterator = this.collection.iterator();
                for (const chunkSize of chunkSizes) {
                    let collection: ICollection<TInput> =
                        new IterableCollection<TInput>([]);
                    for (let i = 0; i < chunkSize; i++) {
                        const item = iterator.next();
                        if (item.value !== undefined) {
                            collection = collection.append([item.value]);
                        }
                    }
                    yield collection;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    partition(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<ICollection<TInput>> {
        return new IterableCollection(
            new IterableCollection.PartionIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static PartionIterable = class<TInput>
        implements Iterable<ICollection<TInput>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<ICollection<TInput>> {
            try {
                let chunkA: ICollection<TInput> =
                    new IterableCollection<TInput>([]);
                let chunkB: ICollection<TInput> =
                    new IterableCollection<TInput>([]);
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (this.filter(item, index, this.collection)) {
                        chunkA = chunkA.append([item]);
                    } else {
                        chunkB = chunkB.append([item]);
                    }
                    index++;
                }
                yield chunkA;
                yield chunkB;
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    sliding(
        chunkSize: number,
        _step = chunkSize - 1,
    ): ICollection<ICollection<TInput>> {
        throw new Error("Method not implemented.");
    }

    groupBy<TOutput = TInput>(
        settings?: GroupBySettings<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<RecordItem<TOutput, ICollection<TInput>>> {
        return new IterableCollection(
            new IterableCollection.GroupByIterable(
                this,
                settings?.map,
                settings?.throwOnNumberLimit ??
                    IterableCollection.THROW_ON_NUMBER_LIMIT,
            ),
        );
    }

    private static GroupByIterable = class<TInput, TOutput = TInput>
        implements Iterable<RecordItem<TOutput, ICollection<TInput>>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private callback: Map<TInput, ICollection<TInput>, TOutput> = (
                item,
            ) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item as any,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<
            RecordItem<TOutput, ICollection<TInput>>
        > {
            const map = new Map<TOutput, ICollection<TInput>>();
            let index = 0;
            for (const item of this.collection) {
                if (
                    this.throwOnNumberLimit &&
                    index === Number.MAX_SAFE_INTEGER
                ) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                const key = this.callback(item, index, this.collection);
                let collection: ICollection<TInput> | undefined = map.get(key);
                if (collection === undefined) {
                    collection = new IterableCollection<TInput>([]);
                    map.set(key, collection);
                }

                map.set(key, collection.append([item]));

                index++;
            }
            yield* map;
        }
    };

    countBy<TOutput = TInput>(
        settings?: GroupBySettings<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<RecordItem<TOutput, number>> {
        return new IterableCollection(
            new IterableCollection.CountByIterable(
                this,
                settings?.map,
                settings?.throwOnNumberLimit ??
                    IterableCollection.THROW_ON_NUMBER_LIMIT,
            ),
        );
    }

    private static CountByIterable = class<TInput, TOutput = TInput>
        implements Iterable<RecordItem<TOutput, number>>
    {
        constructor(
            private collection: ICollection<TInput>,
            private callback: Map<TInput, ICollection<TInput>, TOutput> = (
                item,
            ) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item as any,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<RecordItem<TOutput, number>> {
            try {
                const map = new Map<TOutput, number>();
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    const key = this.callback(item, index, this.collection);
                    if (!map.has(key)) {
                        map.set(key, 0);
                    }
                    const counter = map.get(key);
                    if (counter !== undefined) {
                        map.set(key, counter + 1);
                    }
                    index++;
                }
                yield* map;
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    unique<TOutput>(
        settings?: GroupBySettings<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.UniqueIterable(
                this,
                settings?.map,
                settings?.throwOnNumberLimit ??
                    IterableCollection.THROW_ON_NUMBER_LIMIT,
            ),
        );
    }

    private static UniqueIterable = class<TInput, TOutput>
        implements Iterable<TInput>
    {
        constructor(
            private collection: ICollection<TInput>,
            private callback: Map<TInput, ICollection<TInput>, TOutput> = (
                item,
            ) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item as any,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            try {
                const set = new Set<TOutput>([]);
                let index = 0;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    const item_ = this.callback(item, index, this.collection);
                    if (!set.has(item_)) {
                        yield item;
                    }
                    set.add(item_);
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    prepend<TExtended = TInput>(
        iterable: Iterable<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.MergeIterable(iterable, this),
        );
    }

    append<TExtended = TInput>(
        iterable: Iterable<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.MergeIterable(this, iterable),
        );
    }

    private static MergeIterable = class<TInput, TExtended>
        implements Iterable<TInput | TExtended>
    {
        constructor(
            private iterableA: Iterable<TInput>,
            private iterableB: Iterable<TExtended>,
        ) {}

        *[Symbol.iterator](): Iterator<TInput | TExtended> {
            try {
                yield* this.iterableA;
                yield* this.iterableB;
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    insertBefore<TExtended = TInput>(
        filter: Filter<TInput, ICollection<TInput>>,
        iterable: Iterable<TInput | TExtended>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.InsertBeforeIterable(
                this,
                filter,
                iterable,
                throwOnNumberLimit,
            ),
        );
    }

    private static InsertBeforeIterable = class<TInput, TExtended>
        implements Iterable<TInput | TExtended>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>>,
            private iterable: Iterable<TInput | TExtended>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput | TExtended> {
            try {
                let index = 0;
                let hasMatched = false;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (
                        !hasMatched &&
                        this.filter(item, index, this.collection)
                    ) {
                        yield* this.iterable;
                        hasMatched = true;
                    }
                    yield item;
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    insertAfter<TExtended = TInput>(
        filter: Filter<TInput, ICollection<TInput>>,
        iterable: Iterable<TInput | TExtended>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): ICollection<TInput | TExtended> {
        return new IterableCollection(
            new IterableCollection.InsertAfterIterable(
                this,
                filter,
                iterable,
                throwOnNumberLimit,
            ),
        );
    }

    private static InsertAfterIterable = class<TInput, TExtended>
        implements Iterable<TInput | TExtended>
    {
        constructor(
            private collection: ICollection<TInput>,
            private filter: Filter<TInput, ICollection<TInput>>,
            private iterable: Iterable<TInput | TExtended>,
            private throwOnNumberLimit: boolean,
        ) {}

        *[Symbol.iterator](): Iterator<TInput | TExtended> {
            try {
                let index = 0;
                let hasMatched = false;
                for (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    yield item;
                    if (
                        !hasMatched &&
                        this.filter(item, index, this.collection)
                    ) {
                        yield* this.iterable;
                        hasMatched = true;
                    }
                    index++;
                }
            } catch (error: unknown) {
                if (error instanceof CollectionError) {
                    throw error;
                }
                throw new UnexpectedCollectionError(
                    `Unexpected error "${error}" occured`,
                    error,
                );
            }
        }
    };

    zip<TExtended>(
        iterable: Iterable<TExtended>,
    ): ICollection<RecordItem<TInput, TExtended>> {
        return new IterableCollection(
            new IterableCollection.ZipIterable(this, iterable),
        );
    }

    private static ZipIterable = class<TInput, TExtended>
        implements Iterable<RecordItem<TInput, TExtended>>
    {
        constructor(
            private iterableA: Iterable<TInput>,
            private iterableB: Iterable<TExtended>,
        ) {}

        *[Symbol.iterator](): Iterator<RecordItem<TInput, TExtended>> {
            const iteratorA = this.iterableA[Symbol.iterator]();
            const iteratorB = this.iterableB[Symbol.iterator]();
            while (true) {
                const itemA = iteratorA.next();
                const itemB = iteratorB.next();
                if (itemA.done || itemB.done) {
                    break;
                }
                yield [itemA.value, itemB.value];
            }
        }
    };

    sort(compare?: Comparator<TInput>): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.SortIterable(this, compare),
        );
    }

    private static SortIterable = class<TInput> implements Iterable<TInput> {
        constructor(
            private iterable: Iterable<TInput>,
            private compare?: Comparator<TInput>,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            yield* [...this.iterable].sort(this.compare);
        }
    };

    reverse(settings?: ReverseSettings): ICollection<TInput> {
        return new IterableCollection(
            new IterableCollection.ReverseIterable(this, settings),
        );
    }

    private static ReverseIterable = class<TInput> implements Iterable<TInput> {
        constructor(
            private collection: IterableCollection<TInput>,
            private settings?: ReverseSettings,
        ) {}

        *[Symbol.iterator](): Iterator<TInput> {
            const collection: ICollection<TInput> =
                new IterableCollection<TInput>([]);
            yield* this.collection
                .chunk(
                    this.settings?.chunkSize ??
                        IterableCollection.DEFAULT_CHUNK_SIZE,
                )
                .map(
                    (item) => new IterableCollection([...item].reverse()),
                    this.settings?.throwOnNumberLimit,
                )
                .reduce({
                    reduce: (collection, item) => {
                        return collection.prepend(item);
                    },
                    initialValue: collection,
                    throwOnNumberLimit: this.settings?.throwOnNumberLimit,
                });
        }
    };

    first<TOutput extends TInput>(
        settings?: FindSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        return this.firstOr({
            ...settings,
            defaultValue: null,
        });
    }

    firstOr<TOutput extends TInput, TExtended = TInput>(
        settings: FindOrSettings<
            TInput,
            ICollection<TInput>,
            TOutput,
            TExtended
        >,
    ): TOutput | TExtended {
        try {
            const throwOnNumberLimit =
                settings.throwOnNumberLimit ??
                IterableCollection.THROW_ON_NUMBER_LIMIT;
            let index = 0;
            const filter = settings.filter ?? (() => true);
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (filter(item, index, this)) {
                    return item as TOutput;
                }
                index++;
            }
            if (typeof settings.defaultValue === "function") {
                const defaultFn = settings.defaultValue as () => TOutput;
                return defaultFn();
            }
            return settings.defaultValue;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    firstOrFail<TOutput extends TInput>(
        settings?: FindSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const item = this.first(settings);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    last<TOutput extends TInput>(
        settings?: FindSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        return this.lastOr({
            ...settings,
            defaultValue: null,
        });
    }

    lastOr<TOutput extends TInput, TExtended = TInput>(
        settings: FindOrSettings<
            TInput,
            ICollection<TInput>,
            TOutput,
            TExtended
        >,
    ): TOutput | TExtended {
        try {
            const throwOnNumberLimit =
                settings.throwOnNumberLimit ??
                IterableCollection.THROW_ON_NUMBER_LIMIT;
            let index = 0;
            const filter = settings.filter ?? (() => true);
            let matchedItem: TOutput | null = null;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (filter(item, index, this)) {
                    matchedItem = item as TOutput;
                }
                index++;
            }
            if (matchedItem) {
                return matchedItem;
            }
            if (typeof settings.defaultValue === "function") {
                const defaultFn = settings.defaultValue as () => TOutput;
                return defaultFn();
            }
            return settings.defaultValue;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    lastOrFail<TOutput extends TInput>(
        settings?: FindSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        const item = this.last(settings);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    before(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TInput | null {
        return this.beforeOr(null, filter, throwOnNumberLimit);
    }

    beforeOr<TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TInput | TExtended {
        try {
            let index = 0;
            let beforeItem: TInput | null = null;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (filter(item, index, this) && beforeItem) {
                    return beforeItem;
                }
                index++;
                beforeItem = item;
            }
            if (typeof defaultValue === "function") {
                const defaultFn = defaultValue as () => TExtended;
                return defaultFn();
            }
            return defaultValue;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    beforeOrFail(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TInput {
        const item = this.before(filter, throwOnNumberLimit);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    after(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TInput | null {
        return this.afterOr(null, filter, throwOnNumberLimit);
    }

    afterOr<TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TInput | TExtended {
        try {
            let index = 0;
            let hasMatched = false;
            for (const item of this) {
                if (hasMatched) {
                    return item;
                }
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                hasMatched = filter(item, index, this);
                index++;
            }
            if (typeof defaultValue === "function") {
                const defaultFn = defaultValue as () => TExtended;
                return defaultFn();
            }
            return defaultValue;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError("!!__messge__!!", error);
        }
    }

    afterOrFail(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TInput {
        const item = this.after(filter, throwOnNumberLimit);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    sole<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): TOutput {
        try {
            let index = 0;
            let matchedItem: TOutput | null = null;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (filter(item, index, this)) {
                    if (matchedItem !== null) {
                        throw new MultipleItemsFoundError(
                            "Multiple items were found",
                        );
                    }
                    matchedItem = item as TOutput;
                }
                index++;
            }
            if (matchedItem === null) {
                throw new ItemNotFoundError("Item was not found");
            }
            return matchedItem;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    nth(step: number): ICollection<TInput> {
        return this.filter((_item, index) => index % step === 0);
    }

    count(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): number {
        try {
            let size = 0;
            for (const item of this) {
                if (throwOnNumberLimit && size === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Size has overflowed");
                }
                if (filter(item, size, this)) {
                    size++;
                }
            }
            return size;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    size(
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): number {
        return this.count(() => true, throwOnNumberLimit);
    }

    empty(): boolean {
        try {
            for (const _ of this) {
                return false;
            }
            return true;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    notEmpty(): boolean {
        return !this.empty();
    }

    search(
        filter: Filter<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): number {
        try {
            let index = 0;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (filter(item, index, this)) {
                    return index;
                }
                index++;
            }
            return -1;
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    forEach(
        callback: ForEach<TInput, ICollection<TInput>>,
        throwOnNumberLimit = IterableCollection.THROW_ON_NUMBER_LIMIT,
    ): void {
        try {
            let index = 0;
            for (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                callback(item, index, this);
                index++;
            }
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }

    toArray(): TInput[] {
        try {
            return [...this];
        } catch (error: unknown) {
            if (error instanceof CollectionError) {
                throw error;
            }
            throw new UnexpectedCollectionError(
                `Unexpected error "${error}" occured`,
                error,
            );
        }
    }
}
