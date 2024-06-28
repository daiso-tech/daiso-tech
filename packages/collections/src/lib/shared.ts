// Move to shared library
export type Nullable<TValue> = TValue | null;

export const CMP = {
    LT: "lt",
    EQ: "eq",
    GT: "gt",
} as const;
export type CmpValue = (typeof CMP)[keyof typeof CMP];

export const EQ_INTERNAL_SYMBOL = Symbol("EQ_INTERNAL_SYMBOL");
export const GT_INTERNAL_SYMBOL = Symbol("GT_INTERNAL_SYMBOL");
export const LT_INTERNAL_SYMBOL = Symbol("LT_INTERNAL_SYMBOL");
export type IComparableInternal<TValue> = {
    [EQ_INTERNAL_SYMBOL](value: TValue): boolean;
    [GT_INTERNAL_SYMBOL](value: TValue): boolean;
    [LT_INTERNAL_SYMBOL](value: TValue): boolean;
};
export function isComparableInternal<T>(
    value: Record<string | number | symbol, unknown>,
): value is IComparableInternal<T> {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof value[EQ_INTERNAL_SYMBOL] === "function" &&
        value[EQ_INTERNAL_SYMBOL].arguments === 1 &&
        typeof value[GT_INTERNAL_SYMBOL] === "function" &&
        value[GT_INTERNAL_SYMBOL].arguments === 1 &&
        typeof value[LT_INTERNAL_SYMBOL] === "function" &&
        value[LT_INTERNAL_SYMBOL].arguments === 1
    );
}
export type IComparable<TValue> = {
    eq(value: TValue): boolean;
    gt(value: TValue): boolean;
    gte(value: TValue): boolean;
    lt(value: TValue): boolean;
    lte(value: TValue): boolean;
    cmp(value: TValue): CmpValue;
};
export function fromComparbleInternal<TValue>(
    comparbleInternal: IComparableInternal<TValue>,
): IComparable<TValue> {
    return {
        eq(value: TValue): boolean {
            return comparbleInternal[EQ_INTERNAL_SYMBOL](value);
        },
        gt(value: TValue): boolean {
            return comparbleInternal[GT_INTERNAL_SYMBOL](value);
        },
        gte(value: TValue): boolean {
            return (
                comparbleInternal[GT_INTERNAL_SYMBOL](value) ||
                comparbleInternal[EQ_INTERNAL_SYMBOL](value)
            );
        },
        lt(value: TValue): boolean {
            return comparbleInternal[LT_INTERNAL_SYMBOL](value);
        },
        lte(value: TValue): boolean {
            return (
                comparbleInternal[LT_INTERNAL_SYMBOL](value) ||
                comparbleInternal[EQ_INTERNAL_SYMBOL](value)
            );
        },
        cmp(value: TValue): CmpValue {
            if (comparbleInternal[LT_INTERNAL_SYMBOL](value)) {
                return CMP.LT;
            } else if (comparbleInternal[GT_INTERNAL_SYMBOL](value)) {
                return CMP.GT;
            } else if (comparbleInternal[EQ_INTERNAL_SYMBOL](value)) {
                return CMP.EQ;
            }
            throw new Error();
        },
    };
}

export const ASYNC_EQ_INTERNAL_SYMBOL = Symbol("ASYNC_EQ_INTERNAL_SYMBOL");
export const ASYNC_GT_INTERNAL_SYMBOL = Symbol("ASYNC_GT_INTERNAL_SYMBOL");
export const ASYNC_LT_INTERNAL_SYMBOL = Symbol("ASYNC_LT_INTERNAL_SYMBOL");
export type IAsyncComparableInternal<TValue> = {
    [ASYNC_EQ_INTERNAL_SYMBOL](value: TValue): Promise<boolean>;
    [ASYNC_GT_INTERNAL_SYMBOL](value: TValue): Promise<boolean>;
    [ASYNC_LT_INTERNAL_SYMBOL](value: TValue): Promise<boolean>;
};
export function isAsyncComparableInternal<T>(
    value: Record<string | number | symbol, unknown>,
): value is IAsyncComparableInternal<T> {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof value[ASYNC_EQ_INTERNAL_SYMBOL] === "function" &&
        value[ASYNC_EQ_INTERNAL_SYMBOL].arguments === 1 &&
        typeof value[ASYNC_GT_INTERNAL_SYMBOL] === "function" &&
        value[ASYNC_GT_INTERNAL_SYMBOL].arguments === 1 &&
        typeof value[ASYNC_LT_INTERNAL_SYMBOL] === "function" &&
        value[ASYNC_LT_INTERNAL_SYMBOL].arguments === 1
    );
}
export type IAsyncComparable<TValue> = {
    eq(value: TValue): Promise<boolean>;
    gt(value: TValue): Promise<boolean>;
    gte(value: TValue): Promise<boolean>;
    lt(value: TValue): Promise<boolean>;
    lte(value: TValue): Promise<boolean>;
    cmp(value: TValue): Promise<CmpValue>;
};
export function fromAsyncComparbleInternal<TValue>(
    comparbleInternal: IAsyncComparableInternal<TValue>,
): IAsyncComparable<TValue> {
    return {
        eq(value: TValue): Promise<boolean> {
            return comparbleInternal[ASYNC_EQ_INTERNAL_SYMBOL](value);
        },
        gt(value: TValue): Promise<boolean> {
            return comparbleInternal[ASYNC_GT_INTERNAL_SYMBOL](value);
        },
        async gte(value: TValue): Promise<boolean> {
            return (
                (await comparbleInternal[ASYNC_GT_INTERNAL_SYMBOL](value)) ||
                (await comparbleInternal[ASYNC_EQ_INTERNAL_SYMBOL](value))
            );
        },
        lt(value: TValue): Promise<boolean> {
            return comparbleInternal[ASYNC_LT_INTERNAL_SYMBOL](value);
        },
        async lte(value: TValue): Promise<boolean> {
            return (
                (await comparbleInternal[ASYNC_LT_INTERNAL_SYMBOL](value)) ||
                (await comparbleInternal[ASYNC_EQ_INTERNAL_SYMBOL](value))
            );
        },
        async cmp(value: TValue): Promise<CmpValue> {
            if (await comparbleInternal[ASYNC_LT_INTERNAL_SYMBOL](value)) {
                return CMP.LT;
            } else if (
                await comparbleInternal[ASYNC_GT_INTERNAL_SYMBOL](value)
            ) {
                return CMP.GT;
            } else if (
                await comparbleInternal[ASYNC_EQ_INTERNAL_SYMBOL](value)
            ) {
                return CMP.EQ;
            }
            throw new Error();
        },
    };
}

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
export class OversteppedMaxSafeIntegerError extends UnexpectedCollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = OversteppedMaxSafeIntegerError.name;
    }
}
export class UndersteppedMinSafeIntegerError extends UnexpectedCollectionError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UndersteppedMinSafeIntegerError.name;
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

export type AsyncFilter_<TInput, TCollection> = (
    item: TInput,
    index: number,
    collection: TCollection,
) => Promise<boolean>;
export type AsyncFilter<TInput, TCollection, TOutput extends TInput = TInput> =
    | AsyncFilter_<TInput, TCollection>
    | Filter<TInput, TCollection, TOutput>;

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
