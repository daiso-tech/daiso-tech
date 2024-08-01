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
 * All methods in ListCollection are eager and therefore will run immediately.
 */
export class ListCollection<TInput> implements ICollection<TInput> {
    private array: TInput[];

    constructor(iterable: Iterable<TInput>) {
        this.array = [...iterable];
    }

    *[Symbol.iterator](): Iterator<TInput> {
        try {
            yield* this.array;
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
        try {
            return this[Symbol.iterator]() as Iterator<TInput, void>;
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

    filter<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TOutput> {
        try {
            return new ListCollection(
                this.array.filter((item, index) =>
                    filter(item, index, this),
                ) as TOutput[],
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

    map<TOutput>(
        map: Map<TInput, ICollection<TInput>, TOutput>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TOutput> {
        try {
            return new ListCollection(
                this.array.map((item, index) => map(item, index, this)),
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

    reduce<TOutput = TInput>(
        settings: ReduceSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput {
        try {
            if (settings.initialValue === undefined && this.empty()) {
                throw new InvalidTypeError(
                    "Reduce of empty array must be inputed a initial value",
                );
            }
            if (settings.initialValue !== undefined) {
                return this.array.reduce(
                    (initialValue, item, index) =>
                        settings.reduce(initialValue, item, index, this),
                    settings.initialValue as TOutput,
                );
            }
            return this.array.reduce((initialValue, item, index) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const reduce = settings.reduce as any;
                return reduce(initialValue, item, index, this);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }) as any;
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
        });
    }

    collapse(): ICollection<Collapse<TInput>> {
        const items: TInput[] = [];
        try {
            for (const item of this.array) {
                if (isIterable<TInput>(item)) {
                    items.push(...items);
                } else {
                    items.push(item);
                }
            }
            return new ListCollection(items as Collapse<TInput>[]);
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

    flatMap<TOutput>(
        map: Map<TInput, ICollection<TInput>, Iterable<TOutput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TOutput> {
        try {
            return new ListCollection(
                this.array.flatMap((item, index) => [
                    ...map(item, index, this),
                ]),
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

    update<TFilterOutput extends TInput, TMapOutput>(
        filter: Filter<TInput, ICollection<TInput>, TFilterOutput>,
        map: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<UpdatedItem<TInput, TFilterOutput, TMapOutput>> {
        try {
            return new ListCollection(
                this.array.map((item, index) => {
                    if (filter(item, index, this)) {
                        return map(item as TFilterOutput, index, this);
                    }
                    return item;
                }),
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

    page(settings: PageSettings): ICollection<TInput> {
        const { page, pageSize } = settings;
        if (page < 0) {
            return this.skip(page * pageSize).take(pageSize);
        }
        return this.skip((page - 1) * pageSize).take(page * pageSize);
    }

    sum(_throwOnNumberLimit?: boolean): number {
        return this.reduce({
            reduce: (sum, item) => {
                if (typeof item !== "number") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be number",
                    );
                }
                return sum + item;
            },
            initialValue: 0,
        });
    }

    average(_throwOnNumberLimit?: boolean): number {
        return this.sum() / this.size();
    }

    median(_throwOnNumberLimit?: boolean): number {
        try {
            const nbrs = this.array.map((item) => {
                if (typeof item !== "number") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be number",
                    );
                }
                return item;
            });
            const index = Math.floor(this.array.length / 2);
            const isEven = this.array.length % 2 === 0;
            const a = nbrs[index];
            if (a === undefined) {
                throw new UnexpectedCollectionError("Is in invalid state");
            }
            const b = nbrs[index - 1];
            if (isEven) {
                if (b === undefined) {
                    throw new UnexpectedCollectionError("Is in invalid state");
                }
                return (a + b) / 2;
            }
            return a;
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

    min(): number {
        try {
            let min = 0;
            for (const item of this.array) {
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
            for (const item of this.array) {
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
            return this.reduce({
                reduce: (sum, item) => {
                    if (typeof item !== "bigint") {
                        throw new InvalidTypeError(
                            "Item type is invalid must be bigint",
                        );
                    }
                    return sum + item;
                },
                initialValue: 0n,
            });
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
            return this.sumBigint() / BigInt(this.size());
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

    medianBigint(_throwOnNumberLimit?: boolean): bigint {
        try {
            const nbrs = this.array.map((item) => {
                if (typeof item !== "bigint") {
                    throw new InvalidTypeError(
                        "Item type is invalid must be bigint",
                    );
                }
                return item;
            });
            const index = Math.floor(this.array.length / 2);
            const isEven = this.array.length % 2 === 0;
            const a = nbrs[index];
            if (a === undefined) {
                throw new UnexpectedCollectionError("Is in invalid state");
            }
            const b = nbrs[index - 1];
            if (isEven) {
                if (b === undefined) {
                    throw new UnexpectedCollectionError("Is in invalid state");
                }
                return (a + b) / 2n;
            }
            return a;
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

    minBigint(): bigint {
        try {
            let min = 0n;
            for (const item of this.array) {
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
            for (const item of this.array) {
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
        _throwOnNumberLimit?: boolean,
    ): number {
        try {
            return (this.count(filter) / this.size()) * 100;
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
        _throwOnNumberLimit?: boolean,
    ): boolean {
        try {
            return this.array.some((item, index) => filter(item, index, this));
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
        _throwOnNumberLimit?: boolean,
    ): boolean {
        try {
            return this.array.every((item, index) => filter(item, index, this));
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

    take(limit: number, _throwOnNumberLimit?: boolean): ICollection<TInput> {
        try {
            if (limit < 0) {
                limit = this.size() + limit;
            }
            return this.takeWhile((_item, index) => {
                return index < limit;
            });
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

    takeUntil(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TInput> {
        try {
            const items: TInput[] = [];
            for (const [index, item] of this.array.entries()) {
                if (filter(item, index, this)) {
                    break;
                }
                items.push(item);
            }
            return new ListCollection(items);
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

    takeWhile(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TInput> {
        try {
            return this.takeUntil((...arguments_) => !filter(...arguments_));
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

    skip(offset: number, _throwOnNumberLimit?: boolean): ICollection<TInput> {
        if (offset < 0) {
            offset = this.size() + offset;
        }
        return this.skipWhile((_item, index) => index < offset);
    }

    skipUntil(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TInput> {
        try {
            let hasMatched = false;
            const items: TInput[] = [];
            for (const [index, item] of this.array.entries()) {
                if (!hasMatched) {
                    hasMatched = filter(item, index, this);
                }
                if (hasMatched) {
                    items.push(item);
                }
            }
            return new ListCollection(items);
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

    skipWhile(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TInput> {
        return this.skipUntil((...arguments_) => !filter(...arguments_));
    }

    when<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        try {
            if (condition) {
                return callback(this);
            }
            return this as ICollection<TInput | TExtended>;
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

    whenEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        try {
            return this.when(this.empty(), callback);
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

    whenNot<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        try {
            return this.when(!condition, callback);
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

    whenNotEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended> {
        try {
            return this.when(this.notEmpty(), callback);
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
        try {
            callback(this);
            return new ListCollection(this);
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

    chunk(chunkSize: number): ICollection<ICollection<TInput>> {
        try {
            const chunks: ICollection<TInput>[] = [];
            for (let index = 0; index < this.size(); index += chunkSize) {
                chunks.push(
                    new ListCollection(
                        this.array.slice(index, index + chunkSize),
                    ),
                );
            }
            return new ListCollection(chunks);
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

    chunkWhile(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<ICollection<TInput>> {
        try {
            let currentChunk: ICollection<TInput> = new ListCollection<TInput>(
                [],
            );
            const chunks: ICollection<TInput>[] = [];
            for (const [index, item] of this.array.entries()) {
                if (index === 0) {
                    currentChunk = currentChunk.append([item]);
                } else if (filter(item, index, currentChunk)) {
                    currentChunk = currentChunk.append([item]);
                } else {
                    chunks.push(currentChunk);
                    currentChunk = new ListCollection<TInput>([item]);
                }
            }
            chunks.push(currentChunk);
            return new ListCollection(chunks);
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

    split(
        chunkAmount: number,
        _throwOnNumberLimit?: boolean,
    ): ICollection<ICollection<TInput>> {
        try {
            const size = this.size();
            const minChunkSize = Math.floor(size / chunkAmount);
            const restSize = size % chunkAmount;
            const chunkSizes = Array.from<number>({
                length: chunkAmount,
            }).fill(minChunkSize);

            for (let index = 1; index <= restSize; index++) {
                const chunkIndex = (index - 1) % chunkAmount;
                if (chunkSizes[chunkIndex]) {
                    chunkSizes[chunkIndex] = chunkSizes[chunkIndex] + 1;
                }
            }

            let start = 0;
            let end = 0;
            const chunks: ICollection<TInput>[] = [];
            for (const chunkSize of chunkSizes) {
                end += chunkSize;
                chunks.push(new ListCollection(this.array.slice(start, end)));
                start += chunkSize;
            }

            return new ListCollection<ICollection<TInput>>(chunks);
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

    partition(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<ICollection<TInput>> {
        try {
            const chunkA: TInput[] = [];
            const chunkB: TInput[] = [];
            for (const [index, item] of this.array.entries()) {
                if (filter(item, index, this)) {
                    chunkA.push(item);
                } else {
                    chunkB.push(item);
                }
            }
            return new ListCollection<ICollection<TInput>>([
                new ListCollection(chunkA),
                new ListCollection(chunkB),
            ]);
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

    sliding(
        chunkSize: number,
        _step = chunkSize - 1,
    ): ICollection<ICollection<TInput>> {
        try {
            throw new Error("Method not implemented.");
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

    groupBy<TOutput = TInput>(
        settings?: GroupBySettings<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<RecordItem<TOutput, ICollection<TInput>>> {
        try {
            const map = new Map<TOutput, ICollection<TInput>>();
            const callback = (settings?.map ?? ((item) => item)) as Map<
                TInput,
                ICollection<TInput>,
                TOutput
            >;
            for (const [index, item] of this.array.entries()) {
                const key = callback(item, index, this);
                let collection: ICollection<TInput> | undefined = map.get(key);
                if (collection === undefined) {
                    collection = new ListCollection<TInput>([]);
                    map.set(key, collection);
                }

                map.set(key, collection.append([item]));
            }
            return new ListCollection(map);
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

    countBy<TOutput = TInput>(
        settings?: GroupBySettings<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<RecordItem<TOutput, number>> {
        try {
            const map = new Map<TOutput, number>();
            const callback = (settings?.map ?? ((item) => item)) as Map<
                TInput,
                ICollection<TInput>,
                TOutput
            >;
            for (const [index, item] of this.array.entries()) {
                const key = callback(item, index, this);
                if (!map.has(key)) {
                    map.set(key, 0);
                }
                const counter = map.get(key);
                if (counter !== undefined) {
                    map.set(key, counter + 1);
                }
            }
            return new ListCollection(map);
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

    unique<TOutput = TInput>(
        settings?: GroupBySettings<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TInput> {
        try {
            const set = new Set<TOutput>([]);
            const callback = (settings?.map ?? ((item) => item)) as Map<
                TInput,
                ICollection<TInput>,
                TOutput
            >;
            const items: TInput[] = [];
            for (const [index, item] of this.array.entries()) {
                const item_ = callback(item, index, this);
                if (!set.has(item_)) {
                    items.push(item);
                }
                set.add(item_);
            }
            return new ListCollection(items);
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

    prepend<TExtended = TInput>(
        iterable: Iterable<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        try {
            return new ListCollection([...iterable, ...this.array]);
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

    append<TExtended = TInput>(
        iterable: Iterable<TInput | TExtended>,
    ): ICollection<TInput | TExtended> {
        try {
            return new ListCollection([...this.array, ...iterable]);
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

    insertBefore<TExtended = TInput>(
        filter: Filter<TInput, ICollection<TInput>>,
        iterable: Iterable<TInput | TExtended>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TInput | TExtended> {
        try {
            const index = this.array.findIndex((item, index) =>
                filter(item, index, this),
            );
            if (index === -1) {
                return new ListCollection<TInput | TExtended>(this.array);
            }
            return new ListCollection(
                (this.array as Array<TInput | TExtended>).toSpliced(
                    index,
                    0,
                    ...iterable,
                ),
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

    insertAfter<TExtended = TInput>(
        filter: Filter<TInput, ICollection<TInput>>,
        iterable: Iterable<TInput | TExtended>,
        _throwOnNumberLimit?: boolean,
    ): ICollection<TInput | TExtended> {
        try {
            const index = this.array.findIndex((item, index) =>
                filter(item, index, this),
            );
            if (index === -1) {
                return new ListCollection(this.array) as ICollection<
                    TInput | TExtended
                >;
            }
            const firstPart = this.array.slice(0, index + 1);
            const lastPart = this.array.slice(index + 1);
            return new ListCollection([
                ...firstPart,
                ...iterable,
                ...lastPart,
            ]) as ICollection<TInput | TExtended>;
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

    zip<TExtended>(
        iterable: Iterable<TExtended>,
    ): ICollection<RecordItem<TInput, TExtended>> {
        try {
            const iterableArray = [...iterable];
            let size = iterableArray.length;
            if (size > this.size()) {
                size = this.size();
            }
            const items: RecordItem<TInput, TExtended>[] = [];
            for (let index = 0; index < size; index++) {
                const itemA = this.array[index];
                const itemB = iterableArray[index];
                if (itemA === undefined || itemB === undefined) {
                    continue;
                }
                items.push([itemA, itemB]);
            }
            return new ListCollection(items);
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

    sort(compare?: Comparator<TInput>): ICollection<TInput> {
        try {
            return new ListCollection(this.array.sort(compare));
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

    reverse(_settings?: ReverseSettings): ICollection<TInput> {
        try {
            return new ListCollection(this.array.toReversed());
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

    first<TOutput extends TInput>(
        settings?: FindSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        try {
            return this.firstOr({
                defaultValue: null,
                ...settings,
            });
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

    firstOr<TOutput extends TInput, TExtended = TInput>(
        settings: FindOrSettings<
            TInput,
            ICollection<TInput>,
            TOutput,
            TExtended
        >,
    ): TOutput | TExtended {
        try {
            const filter = settings.filter ?? (() => true);
            for (const [index, item] of this.array.entries()) {
                if (filter(item, index, this)) {
                    return item as TOutput;
                }
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
        try {
            const item = this.first(settings);
            if (item === null) {
                throw new ItemNotFoundError("Item was not found");
            }
            return item;
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

    last<TOutput extends TInput>(
        settings?: FindSettings<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null {
        try {
            return this.lastOr({
                ...settings,
                defaultValue: null,
            });
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

    lastOr<TOutput extends TInput, TExtended = TInput>(
        settings: FindOrSettings<
            TInput,
            ICollection<TInput>,
            TOutput,
            TExtended
        >,
    ): TOutput | TExtended {
        try {
            const filter = settings.filter ?? (() => true);
            let matchedItem: TOutput | null = null;
            for (const [index, item] of this.array.entries()) {
                if (filter(item, index, this)) {
                    matchedItem = item as TOutput;
                }
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
        try {
            const item = this.last(settings);
            if (item === null) {
                throw new ItemNotFoundError("Item was not found");
            }
            return item;
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

    before(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): TInput | null {
        try {
            return this.beforeOr(null, filter);
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

    beforeOr<TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): TInput | TExtended {
        try {
            for (const [index, item] of this.array.entries()) {
                const beforeItem = this.array[index - 1];
                if (filter(item, index, this) && beforeItem !== undefined) {
                    return beforeItem;
                }
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
        _throwOnNumberLimit?: boolean,
    ): TInput {
        try {
            const item = this.before(filter);
            if (item === null) {
                throw new ItemNotFoundError("Item was not found");
            }
            return item;
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

    after(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): TInput | null {
        try {
            return this.afterOr(null, filter);
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

    afterOr<TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): TInput | TExtended {
        try {
            for (const [index, item] of this.array.entries()) {
                const beforeItem = this.array[index + 1];
                if (filter(item, index, this) && beforeItem !== undefined) {
                    return beforeItem;
                }
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

    afterOrFail(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): TInput {
        try {
            const item = this.after(filter);
            if (item === null) {
                throw new ItemNotFoundError("Item was not found");
            }
            return item;
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

    sole<TOutput extends TInput>(
        filter: Filter<TInput, ICollection<TInput>, TOutput>,
        _throwOnNumberLimit?: boolean,
    ): TOutput {
        try {
            const matchedItems: TInput[] = [];
            for (const [index, item] of this.array.entries()) {
                if (filter(item, index, this)) {
                    matchedItems.push(item);
                }
                if (matchedItems.length > 1) {
                    throw new MultipleItemsFoundError(
                        "Multiple items were found",
                    );
                }
            }
            const [matchedItem] = matchedItems;
            if (matchedItem === undefined) {
                throw new ItemNotFoundError("Item was not found");
            }
            return matchedItem as TOutput;
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
        try {
            return this.filter((_item, index) => index % step === 0);
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

    count(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): number {
        try {
            return this.filter(filter).size();
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

    size(_throwOnNumberLimit?: boolean): number {
        try {
            return this.array.length;
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

    empty(): boolean {
        try {
            return this.array.length === 0;
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
        try {
            return this.array.length !== 0;
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

    search(
        filter: Filter<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): number {
        try {
            return this.array.findIndex((item, index) =>
                filter(item, index, this),
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

    forEach(
        callback: ForEach<TInput, ICollection<TInput>>,
        _throwOnNumberLimit?: boolean,
    ): void {
        try {
            for (const [index, item] of this.array.entries()) {
                callback(item, index, this);
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
            return [...this.array];
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
