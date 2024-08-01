export class CollectionError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = CollectionError.name;
    }
}
export class UnexpectedCollectionError extends CollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnexpectedCollectionError.name;
    }
}
export class NumberOverflowError extends UnexpectedCollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = NumberOverflowError.name;
    }
}
export class NumberUnderflowError extends UnexpectedCollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = NumberUnderflowError.name;
    }
}
export class ItemNotFoundError extends CollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = ItemNotFoundError.name;
    }
}
export class MultipleItemsFoundError extends CollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = MultipleItemsFoundError.name;
    }
}
export class InvalidTypeError extends CollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidTypeError.name;
    }
}

export type UpdatedItem<TInput, TFilterOutput, TMapOutput> =
    | TInput
    | TFilterOutput
    | TMapOutput;
export type RecordItem<TKey, TValue> = [key: TKey, value: TValue];
export type ReverseSettings = {
    chunkSize?: number;
    throwOnNumberLimit?: boolean;
};
export type PageSettings = {
    page: number;
    pageSize: number;
    throwOnNumberLimit?: boolean;
};
export type JoinSettings = {
    seperator?: string;
    throwOnNumberLimit?: boolean;
};
export type Comparator<TItem> = (itemA: TItem, itemB: TItem) => number;

type Filter_<TInput, TCollection> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => boolean;
export type FilterGuard<
    TInput,
    TCollection,
    TOutput extends TInput = TInput,
> = (item: TInput, index: number, collection: TCollection) => item is TOutput;
export type Filter<TInput, TCollection, TOutput extends TInput = TInput> =
    | Filter_<TInput, TCollection>
    | FilterGuard<TInput, TCollection, TOutput>;
export type Reduce<TInput, TCollection, TOutput> = (
    output: TOutput,
    item: TInput,
    index: number,
    collection: TCollection,
) => TOutput;
export type ReduceSettings<TInput, TCollection, TOutput> = {
    reduce: Reduce<TInput, TCollection, TOutput>;
    initialValue?: TOutput;
    throwOnNumberLimit?: boolean;
};
export type Map<TInput, TCollection, TOutput> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => TOutput;
export type ForEach<TInput, TCollection> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => void;
export type Modifier<TInput, TOutput> = (collection: TInput) => TOutput;
export type Tap<TCollection> = (collection: TCollection) => void;
export type Transform<TInput, TOutput> = (value: TInput) => TOutput;
export type Lazyable<TValue> = TValue | (() => TValue);
export type FindSettings<TInput, TCollection, TOutput extends TInput> = {
    filter?: Filter<TInput, TCollection, TOutput>;
    throwOnNumberLimit?: boolean;
};
export type FindOrSettings<
    TInput,
    TCollection,
    TOutput extends TInput,
    TDefault,
> = FindSettings<TInput, TCollection, TOutput> & {
    defaultValue: Lazyable<TDefault>;
};
export type GroupBySettings<TInput, TCollection, TOutput> = {
    map?: Map<TInput, TCollection, TOutput>;
    throwOnNumberLimit?: boolean;
};

type AsyncFilter_<TInput, TCollection> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => Promise<boolean>;
export type AsyncFilter<TInput, TCollection, TOutput extends TInput = TInput> =
    | AsyncFilter_<TInput, TCollection>
    | Filter<TInput, TCollection, TOutput>;
type AsyncReduce_<TInput, TCollection, TOutput> = (
    output: TOutput,
    item: TInput,
    index: number,
    collection: TCollection,
) => Promise<TOutput>;
export type AsyncReduce<TInput, TCollection, TOutput> =
    | AsyncReduce_<TInput, TCollection, TOutput>
    | Reduce<TInput, TCollection, TOutput>;
export type AsyncReduceSettings<TInput, TCollection, TOutput> = {
    reduce: AsyncReduce<TInput, TCollection, TOutput>;
    initialValue?: TOutput;
    throwOnNumberLimit?: boolean;
};
type AsyncMap_<TInput, TCollection, TOutput> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => Promise<TOutput>;
export type AsyncMap<TInput, TCollection, TOutput> =
    | AsyncMap_<TInput, TCollection, TOutput>
    | Map<TInput, TCollection, TOutput>;
type AsyncForEach_<TInput, TCollection> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => Promise<void>;
export type AsyncForEach<TInput, TCollection> =
    | ForEach<TInput, TCollection>
    | AsyncForEach_<TInput, TCollection>;
type AsyncModifier_<TInput, TOutput> = (collection: TInput) => Promise<TOutput>;
export type AsyncModifier<TInput, TOutput> =
    | Modifier<TInput, TOutput>
    | AsyncModifier_<TInput, TOutput>;
type AsyncTap_<TCollection> = (collection: TCollection) => Promise<void>;
export type AsyncTap<TCollection> = Tap<TCollection> | AsyncTap_<TCollection>;
type AsyncTransform_<TInput, TOutput> = (value: TInput) => Promise<TOutput>;
export type AsyncTransform<TInput, TOutput> =
    | Transform<TInput, TOutput>
    | AsyncTransform_<TInput, TOutput>;
export type AsyncLazyable_<TValue> = TValue | (() => Promise<TValue>);
export type AsyncLazyable<TValue> = AsyncLazyable_<TValue> | Lazyable<TValue>;
export type AsyncFindSettings<TInput, TCollection, TOutput extends TInput> = {
    filter?: AsyncFilter<TInput, TCollection, TOutput>;
    throwOnNumberLimit?: boolean;
};
export type AsyncFindOrSettings<
    TInput,
    TCollection,
    TOutput extends TInput,
    TDefault,
> = AsyncFindSettings<TInput, TCollection, TOutput> & {
    defaultValue: AsyncLazyable<TDefault>;
};
export type AsyncGroupBySettings<TInput, TCollection, TOutput> = {
    map?: AsyncMap<TInput, TCollection, TOutput>;
    chunkSize?: number;
    throwOnNumberLimit?: boolean;
};
