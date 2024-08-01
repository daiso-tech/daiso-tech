import { isIterable } from "../../../helpers";
import { isAsyncIterable } from "../../../helpers";
import {
    type AsyncFilter,
    type AsyncFindOrSettings,
    type AsyncFindSettings,
    type AsyncForEach,
    type AsyncGroupBySettings,
    type AsyncLazyable,
    type AsyncMap,
    type AsyncModifier,
    type AsyncReduceSettings,
    type AsyncTap,
    type AsyncTransform,
    CollectionError,
    type Comparator,
    InvalidTypeError,
    ItemNotFoundError,
    type JoinSettings,
    MultipleItemsFoundError,
    NumberOverflowError,
    NumberUnderflowError,
    type PageSettings,
    type RecordItem,
    type ReverseSettings,
    UnexpectedCollectionError,
    type UpdatedItem,
} from "../../../shared";
import {
    type AsyncCollapse,
    type AsyncIterableValue,
    type IAsyncCollection,
} from "../../async-collection.contract";

export class AsyncIterableCollection<TInput>
    implements IAsyncCollection<TInput>
{
    private static THROW_ON_NUMBER_LIMIT = false;

    private static DEFAULT_CHUNK_SIZE = 1024;

    constructor(private iterable: AsyncIterableValue<TInput>) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
        yield* this.iterable;
    }

    iterator(): AsyncIterator<TInput, void> {
        return this[Symbol.asyncIterator]() as AsyncIterator<TInput, void>;
    }

    filter<TOutput extends TInput>(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>, TOutput>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TOutput> {
        return new AsyncIterableCollection<TOutput>(
            new AsyncIterableCollection.AsyncFilterIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncFilterIterable = class<TInput, TOutput extends TInput>
        implements AsyncIterable<TOutput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<
                TInput,
                IAsyncCollection<TInput>,
                TOutput
            >,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TOutput> {
            try {
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (await this.filter(item, index, this.collection)) {
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
        map: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TOutput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncMapIterable(
                this,
                map,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncMapIterable = class<TInput, TOutput>
        implements AsyncIterable<TOutput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private map: AsyncMap<TInput, IAsyncCollection<TInput>, TOutput>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TOutput> {
            try {
                let index = 0;
                for await (const item of this.collection) {
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

    async reduce<TOutput = TInput>(
        settings: AsyncReduceSettings<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        >,
    ): Promise<TOutput> {
        const { reduce, initialValue, throwOnNumberLimit } = settings;
        if (initialValue === undefined && (await this.empty())) {
            throw new InvalidTypeError(
                "Reduce of empty array must be inputed a initial value",
            );
        }
        if (initialValue !== undefined) {
            let output = initialValue as TOutput;
            let index = 0;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                output = await reduce(output, item, index, this);
                index++;
            }
            return output;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let output: TOutput = (await this.firstOrFail()) as any;
        let index = 0;
        let isFirstIteration = true;
        for await (const item of this) {
            if (!isFirstIteration) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                output = await reduce(output, item, index, this);
            }
            isFirstIteration = false;
            index++;
        }
        return output;
    }

    async join(settings?: JoinSettings): Promise<string> {
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
                AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
        });
    }

    collapse(): IAsyncCollection<AsyncCollapse<TInput>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncCollapseIterable(this),
        );
    }

    private static AsyncCollapseIterable = class<TInput>
        implements AsyncIterable<AsyncCollapse<TInput>>
    {
        constructor(private collection: IAsyncCollection<TInput>) {}

        async *[Symbol.asyncIterator](): AsyncIterator<AsyncCollapse<TInput>> {
            try {
                for await (const item of this.collection) {
                    if (
                        isIterable<TInput>(item) ||
                        isAsyncIterable<TInput>(item)
                    ) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        yield* item as any;
                    } else {
                        yield item as AsyncCollapse<TInput>;
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
        map: AsyncMap<TInput, IAsyncCollection<TInput>, Iterable<TOutput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TOutput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncFlatMapIterable(
                this,
                map,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncFlatMapIterable = class<TInput, TOutput>
        implements AsyncIterable<TOutput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private map: AsyncMap<
                TInput,
                IAsyncCollection<TInput>,
                Iterable<TOutput>
            >,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TOutput> {
            try {
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    yield* await this.map(item, index, this.collection);
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>, TFilterOutput>,
        map: AsyncMap<TFilterOutput, IAsyncCollection<TInput>, TMapOutput>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<UpdatedItem<TInput, TFilterOutput, TMapOutput>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncUpdateIterable(
                this,
                filter,
                map,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncUpdateIterable = class<
        TInput,
        TFilterOutput extends TInput,
        TMapOutput,
    > implements AsyncIterable<UpdatedItem<TInput, TFilterOutput, TMapOutput>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<
                TInput,
                IAsyncCollection<TInput>,
                TFilterOutput
            >,
            private map: AsyncMap<
                TFilterOutput,
                IAsyncCollection<TInput>,
                TMapOutput
            >,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            UpdatedItem<TInput, TFilterOutput, TMapOutput>
        > {
            try {
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (await this.filter(item, index, this.collection)) {
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

    page(settings: PageSettings): IAsyncCollection<TInput> {
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

    async sum(throwOnNumberLimit?: boolean): Promise<number> {
        try {
            let sum = 0;
            for await (const item of this) {
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

    async average(throwOnNumberLimit?: boolean): Promise<number> {
        try {
            let size = 0;
            let sum = 0;
            for await (const item of this) {
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

    async median(throwOnNumberLimit?: boolean): Promise<number> {
        if (await this.empty()) {
            return 0;
        }
        const size = await this.size(throwOnNumberLimit);
        if (size === 0) {
            return 0;
        }
        const isEven = size % 2 === 0;
        const items = await this.map((item) => {
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

    async min(): Promise<number> {
        try {
            let min = 0;
            for await (const item of this) {
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

    async max(): Promise<number> {
        try {
            let max = 0;
            for await (const item of this) {
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

    async sumBigint(): Promise<bigint> {
        try {
            let sum = 0n;
            for await (const item of this) {
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

    async averageBigint(): Promise<bigint> {
        try {
            let index = 0n;
            let sum = 0n;
            for await (const item of this) {
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

    async medianBigint(throwOnNumberLimit?: boolean): Promise<bigint> {
        if (await this.empty()) {
            return 0n;
        }
        const size = await this.size(throwOnNumberLimit);
        if (size === 0) {
            return 0n;
        }
        const isEven = size % 2 === 0;
        const items = await this.map((item) => {
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

    async minBigint(): Promise<bigint> {
        try {
            let min = 0n;
            for await (const item of this) {
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

    async maxBigint(): Promise<bigint> {
        try {
            let max = 0n;
            for await (const item of this) {
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

    async percentage(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<number> {
        try {
            if (await this.empty()) {
                return 0;
            }
            let total = 0;
            let part = 0;
            for await (const item of this) {
                if (throwOnNumberLimit && total === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError(
                        "The total amount has overflowed",
                    );
                }
                if (await filter(item, total, this)) {
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

    async some<TOutput extends TInput>(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>, TOutput>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<boolean> {
        try {
            let index = 0;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (await filter(item, index, this)) {
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

    async every<TOutput extends TInput>(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>, TOutput>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<boolean> {
        try {
            let index = 0;
            let isTrue = true;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                isTrue = isTrue && (await filter(item, index, this));
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
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncTakeIterable(
                this,
                limit,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncTakeIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private limit: number,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            try {
                if (this.limit < 0) {
                    this.limit =
                        (await this.collection.size(this.throwOnNumberLimit)) +
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncTakeUntilIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncTakeUntilIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            try {
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (await this.filter(item, index, this.collection)) {
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput> {
        return this.takeUntil(
            (...arguments_) => !filter(...arguments_),
            throwOnNumberLimit,
        );
    }

    skip(
        offset: number,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncSkipIterable(
                this,
                offset,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncSkipIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private limit: number,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            try {
                if (this.limit < 0) {
                    this.limit =
                        (await this.collection.size(this.throwOnNumberLimit)) +
                        this.limit;
                }
                yield* this.collection.skipWhile(
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

    skipUntil(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncSkipUntilIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncSkipUntilIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            try {
                let index = 0;
                let hasMatched = false;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (!hasMatched) {
                        hasMatched = await this.filter(
                            item,
                            index,
                            this.collection,
                        );
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

    skipWhile(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput> {
        return this.skipUntil(
            (...arguments_) => !filter(...arguments_),
            throwOnNumberLimit,
        );
    }

    when<TExtended = TInput>(
        condition: boolean,
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncWhenIterable(
                this,
                () => condition,
                callback,
            ),
        );
    }

    whenEmpty<TExtended = TInput>(
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncWhenIterable(
                this,
                () => this.empty(),
                callback,
            ),
        );
    }

    whenNot<TExtended = TInput>(
        condition: boolean,
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncWhenIterable(
                this,
                () => !condition,
                callback,
            ),
        );
    }

    whenNotEmpty<TExtended = TInput>(
        callback: AsyncModifier<
            IAsyncCollection<TInput>,
            IAsyncCollection<TExtended>
        >,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncWhenIterable(
                this,
                () => this.notEmpty(),
                callback,
            ),
        );
    }

    private static AsyncWhenIterable = class<TInput, TExtended>
        implements AsyncIterable<TInput | TExtended>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private condition: () => boolean | Promise<boolean>,
            private callback: AsyncModifier<
                IAsyncCollection<TInput>,
                IAsyncCollection<TExtended>
            >,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
            try {
                if (await this.condition()) {
                    yield* await this.callback(this.collection);
                    return;
                }
                yield* this.collection as IAsyncCollection<TInput | TExtended>;
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

    async pipe<TOutput = TInput>(
        callback: AsyncTransform<IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput> {
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

    tap(
        callback: AsyncTap<IAsyncCollection<TInput>>,
    ): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncTapIterable(this, callback),
        );
    }

    private static AsyncTapIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private callback: AsyncTap<IAsyncCollection<TInput>>,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            try {
                await this.callback(this.collection);
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

    chunk(chunkSize: number): IAsyncCollection<IAsyncCollection<TInput>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncChunkIterable(this, chunkSize),
        );
    }

    private static AsyncChunkIterable = class<TInput>
        implements AsyncIterable<IAsyncCollection<TInput>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private chunkSize: number,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            IAsyncCollection<TInput>
        > {
            try {
                let chunk: IAsyncCollection<TInput> =
                    new AsyncIterableCollection<TInput>([]);
                let currentChunkSize = 0;
                let isFirstIteration = true;
                for await (const item of this.collection) {
                    currentChunkSize = currentChunkSize % this.chunkSize;
                    const isFilled = currentChunkSize === 0;
                    if (!isFirstIteration && isFilled) {
                        yield chunk;
                        chunk = new AsyncIterableCollection<TInput>([]);
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<IAsyncCollection<TInput>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncChunkWhileIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncChunkWhileIterable = class<TInput>
        implements AsyncIterable<IAsyncCollection<TInput>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            IAsyncCollection<TInput>
        > {
            try {
                let index = 0;
                let collection: IAsyncCollection<TInput> =
                    new AsyncIterableCollection<TInput>([]);
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (index === 0) {
                        collection = collection.append([item]);
                    } else if (await this.filter(item, index, collection)) {
                        collection = collection.append([item]);
                    } else {
                        yield collection;
                        collection = new AsyncIterableCollection<TInput>([
                            item,
                        ]);
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
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<IAsyncCollection<TInput>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncSplitIterable(
                this,
                chunkAmount,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncSplitIterable = class<TInput>
        implements AsyncIterable<IAsyncCollection<TInput>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private chunkAmount: number,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            IAsyncCollection<TInput>
        > {
            try {
                const size = await this.collection.size(
                    this.throwOnNumberLimit,
                );
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
                    let collection: IAsyncCollection<TInput> =
                        new AsyncIterableCollection<TInput>([]);
                    for (let i = 0; i < chunkSize; i++) {
                        const item = await iterator.next();
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<IAsyncCollection<TInput>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncPartionIterable(
                this,
                filter,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncPartionIterable = class<TInput>
        implements AsyncIterable<IAsyncCollection<TInput>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            IAsyncCollection<TInput>
        > {
            try {
                let chunkA: IAsyncCollection<TInput> =
                    new AsyncIterableCollection<TInput>([]);
                let chunkB: IAsyncCollection<TInput> =
                    new AsyncIterableCollection<TInput>([]);
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (await this.filter(item, index, this.collection)) {
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
    ): IAsyncCollection<IAsyncCollection<TInput>> {
        throw new Error("Method not implemented.");
    }

    groupBy<TOutput = TInput>(
        settings?: AsyncGroupBySettings<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        >,
    ): IAsyncCollection<RecordItem<TOutput, IAsyncCollection<TInput>>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncGroupByIterable(
                this,
                settings?.map,
                settings?.throwOnNumberLimit ??
                    AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
            ),
        );
    }

    private static AsyncGroupByIterable = class<TInput, TOutput = TInput>
        implements AsyncIterable<RecordItem<TOutput, IAsyncCollection<TInput>>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private callback: AsyncMap<
                TInput,
                IAsyncCollection<TInput>,
                TOutput
            > = (item) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item as any,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            RecordItem<TOutput, IAsyncCollection<TInput>>
        > {
            const map = new Map<TOutput, IAsyncCollection<TInput>>();
            let index = 0;
            for await (const item of this.collection) {
                if (
                    this.throwOnNumberLimit &&
                    index === Number.MAX_SAFE_INTEGER
                ) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                const key = await this.callback(item, index, this.collection);
                let collection: IAsyncCollection<TInput> | undefined =
                    map.get(key);
                if (collection === undefined) {
                    collection = new AsyncIterableCollection<TInput>([]);
                    map.set(key, collection);
                }

                map.set(key, collection.append([item]));

                index++;
            }
            yield* map;
        }
    };

    countBy<TOutput = TInput>(
        settings?: AsyncGroupBySettings<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        >,
    ): IAsyncCollection<RecordItem<TOutput, number>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncCountByIterable(
                this,
                settings?.map,
                settings?.throwOnNumberLimit ??
                    AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
            ),
        );
    }

    private static AsyncCountByIterable = class<TInput, TOutput = TInput>
        implements AsyncIterable<RecordItem<TOutput, number>>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private callback: AsyncMap<
                TInput,
                IAsyncCollection<TInput>,
                TOutput
            > = (item) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item as any,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            RecordItem<TOutput, number>
        > {
            try {
                const map = new Map<TOutput, number>();
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    const key = await this.callback(
                        item,
                        index,
                        this.collection,
                    );
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

    unique<TOutput = TInput>(
        settings?: AsyncGroupBySettings<
            TInput,
            IAsyncCollection<TInput>,
            TOutput
        >,
    ): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncUniqueIterable(
                this,
                settings?.map,
                settings?.throwOnNumberLimit ??
                    AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
            ),
        );
    }

    private static AsyncUniqueIterable = class<TInput, TOutput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private callback: AsyncMap<
                TInput,
                IAsyncCollection<TInput>,
                TOutput
            > = (item) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item as any,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            try {
                const set = new Set<TOutput>([]);
                let index = 0;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    const item_ = await this.callback(
                        item,
                        index,
                        this.collection,
                    );
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
        iterable: AsyncIterableValue<TInput | TExtended>,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncMergeIterable(iterable, this),
        );
    }

    append<TExtended = TInput>(
        iterable: AsyncIterableValue<TInput | TExtended>,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncMergeIterable(this, iterable),
        );
    }

    private static AsyncMergeIterable = class<TInput, TExtended>
        implements AsyncIterable<TInput | TExtended>
    {
        constructor(
            private iterableA: AsyncIterableValue<TInput>,
            private iterableB: AsyncIterableValue<TExtended>,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        iterable: AsyncIterableValue<TInput | TExtended>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncInsertBeforeIterable(
                this,
                filter,
                iterable,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncInsertBeforeIterable = class<TInput, TExtended>
        implements AsyncIterable<TInput | TExtended>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
            private iterable: AsyncIterableValue<TInput | TExtended>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
            try {
                let index = 0;
                let hasMatched = false;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    if (
                        !hasMatched &&
                        (await this.filter(item, index, this.collection))
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
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        iterable: AsyncIterableValue<TInput | TExtended>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): IAsyncCollection<TInput | TExtended> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncInsertAfterIterable(
                this,
                filter,
                iterable,
                throwOnNumberLimit,
            ),
        );
    }

    private static AsyncInsertAfterIterable = class<TInput, TExtended>
        implements AsyncIterable<TInput | TExtended>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
            private iterable: AsyncIterableValue<TInput | TExtended>,
            private throwOnNumberLimit: boolean,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput | TExtended> {
            try {
                let index = 0;
                let hasMatched = false;
                for await (const item of this.collection) {
                    if (
                        this.throwOnNumberLimit &&
                        index === Number.MAX_SAFE_INTEGER
                    ) {
                        throw new NumberOverflowError("Index has overflowed");
                    }
                    yield item;
                    if (
                        !hasMatched &&
                        (await this.filter(item, index, this.collection))
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
        iterable: AsyncIterableValue<TExtended>,
    ): IAsyncCollection<RecordItem<TInput, TExtended>> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncZipIterable(this, iterable),
        );
    }

    private static AsyncZipIterable = class<TInput, TExtended>
        implements AsyncIterable<RecordItem<TInput, TExtended>>
    {
        constructor(
            private iterableA: AsyncIterableValue<TInput>,
            private iterableB: AsyncIterableValue<TExtended>,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<
            RecordItem<TInput, TExtended>
        > {
            let iteratorA: AsyncIterator<TInput> | Iterator<TInput>;
            if (isIterable(this.iterableA)) {
                iteratorA = this.iterableA[Symbol.iterator]();
            } else {
                iteratorA = this.iterableA[Symbol.asyncIterator]();
            }

            let iteratorB: AsyncIterator<TExtended> | Iterator<TExtended>;
            if (isIterable(this.iterableB)) {
                iteratorB = this.iterableB[Symbol.iterator]();
            } else {
                iteratorB = this.iterableB[Symbol.asyncIterator]();
            }

            while (true) {
                const itemA = await iteratorA.next();
                const itemB = await iteratorB.next();
                if (itemA.done || itemB.done) {
                    break;
                }
                yield [itemA.value, itemB.value];
            }
        }
    };

    sort(compare?: Comparator<TInput> | undefined): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncSortIterable(this, compare),
        );
    }

    private static AsyncSortIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: IAsyncCollection<TInput>,
            private compare?: Comparator<TInput>,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            yield* [...(await this.collection.toArray())].sort(this.compare);
        }
    };

    reverse(settings?: ReverseSettings): IAsyncCollection<TInput> {
        return new AsyncIterableCollection(
            new AsyncIterableCollection.AsyncReverseIterable(this, settings),
        );
    }

    private static AsyncReverseIterable = class<TInput>
        implements AsyncIterable<TInput>
    {
        constructor(
            private collection: AsyncIterableCollection<TInput>,
            private settings?: ReverseSettings,
        ) {}

        async *[Symbol.asyncIterator](): AsyncIterator<TInput> {
            const collection: IAsyncCollection<TInput> =
                new AsyncIterableCollection<TInput>([]);
            yield* await this.collection
                .chunk(
                    this.settings?.chunkSize ??
                        AsyncIterableCollection.DEFAULT_CHUNK_SIZE,
                )
                .map(
                    async (item) =>
                        new AsyncIterableCollection(
                            [...(await item.toArray())].reverse(),
                        ),
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

    async first<TOutput extends TInput>(
        settings?: AsyncFindSettings<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput | null> {
        return this.firstOr({
            ...settings,
            defaultValue: null,
        });
    }

    async firstOr<TOutput extends TInput, TExtended = TInput>(
        settings: AsyncFindOrSettings<
            TInput,
            IAsyncCollection<TInput>,
            TOutput,
            TExtended
        >,
    ): Promise<TOutput | TExtended> {
        try {
            const throwOnNumberLimit =
                settings.throwOnNumberLimit ??
                AsyncIterableCollection.THROW_ON_NUMBER_LIMIT;
            let index = 0;
            const filter = settings.filter ?? (() => true);
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (await filter(item, index, this)) {
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

    async firstOrFail<TOutput extends TInput>(
        settings?: AsyncFindSettings<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput> {
        const item = await this.first(settings);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    async last<TOutput extends TInput>(
        settings?: AsyncFindSettings<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput | null> {
        return this.lastOr({
            ...settings,
            defaultValue: null,
        });
    }

    async lastOr<TOutput extends TInput, TExtended = TInput>(
        settings: AsyncFindOrSettings<
            TInput,
            IAsyncCollection<TInput>,
            TOutput,
            TExtended
        >,
    ): Promise<TOutput | TExtended> {
        try {
            const throwOnNumberLimit =
                settings.throwOnNumberLimit ??
                AsyncIterableCollection.THROW_ON_NUMBER_LIMIT;
            let index = 0;
            const filter = settings.filter ?? (() => true);
            let matchedItem: TOutput | null = null;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (await filter(item, index, this)) {
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

    async lastOrFail<TOutput extends TInput>(
        settings?: AsyncFindSettings<TInput, IAsyncCollection<TInput>, TOutput>,
    ): Promise<TOutput> {
        const item = await this.last(settings);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    async before(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TInput | null> {
        return this.beforeOr(null, filter, throwOnNumberLimit);
    }

    async beforeOr<TExtended = TInput>(
        defaultValue: AsyncLazyable<TExtended>,
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TInput | TExtended> {
        try {
            let index = 0;
            let beforeItem: TInput | null = null;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if ((await filter(item, index, this)) && beforeItem) {
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

    async beforeOrFail(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TInput> {
        const item = await this.before(filter, throwOnNumberLimit);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    async after(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TInput | null> {
        return this.afterOr(null, filter, throwOnNumberLimit);
    }

    async afterOr<TExtended = TInput>(
        defaultValue: AsyncLazyable<TExtended>,
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TInput | TExtended> {
        try {
            let index = 0;
            let hasMatched = false;
            for await (const item of this) {
                if (hasMatched) {
                    return item;
                }
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                hasMatched = await filter(item, index, this);
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

    async afterOrFail(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TInput> {
        const item = await this.after(filter, throwOnNumberLimit);
        if (item === null) {
            throw new ItemNotFoundError("Item was not found");
        }
        return item;
    }

    async sole<TOutput extends TInput>(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>, TOutput>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<TOutput> {
        try {
            let index = 0;
            let matchedItem: TOutput | null = null;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (await filter(item, index, this)) {
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

    nth(step: number): IAsyncCollection<TInput> {
        return this.filter((_item, index) => index % step === 0);
    }

    async count(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<number> {
        try {
            let size = 0;
            for await (const item of this) {
                if (throwOnNumberLimit && size === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Size has overflowed");
                }
                if (await filter(item, size, this)) {
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

    async size(throwOnNumberLimit?: boolean): Promise<number> {
        return this.count(() => true, throwOnNumberLimit);
    }

    async empty(): Promise<boolean> {
        try {
            for await (const _ of this) {
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

    async notEmpty(): Promise<boolean> {
        return !(await this.empty());
    }

    async search(
        filter: AsyncFilter<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<number> {
        try {
            let index = 0;
            for await (const item of this) {
                if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                    throw new NumberOverflowError("Index has overflowed");
                }
                if (await filter(item, index, this)) {
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

    async forEach(
        callback: AsyncForEach<TInput, IAsyncCollection<TInput>>,
        throwOnNumberLimit = AsyncIterableCollection.THROW_ON_NUMBER_LIMIT,
    ): Promise<void> {
        let index = 0;
        for await (const item of this) {
            if (throwOnNumberLimit && index === Number.MAX_SAFE_INTEGER) {
                throw new NumberOverflowError("Index has overflowed");
            }
            callback(item, index, this);
            index++;
        }
    }

    async toArray(): Promise<TInput[]> {
        try {
            const items: TInput[] = [];
            for await (const item of this) {
                items.push(item);
            }
            return items;
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
