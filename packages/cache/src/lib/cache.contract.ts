export class CacheError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = CacheError.name;
    }
}
export class UnexpectedCacheError extends CacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnexpectedCacheError.name;
    }
}
export class UnableToGetItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetItemsError.name;
    }
}
export class UnableToSetItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToSetItemsError.name;
    }
}
export class UnableToUpdateItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToUpdateItemsError.name;
    }
}
export class UnableToRemoveItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRemoveItemsError.name;
    }
}
export class UnableToCheckForItemsExistenceError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCheckForItemsExistenceError.name;
    }
}
export class UnableToPullItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToPullItemsError.name;
    }
}
export class UnableToAddItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToAddItemsError.name;
    }
}
export class UnableToIncrementItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToIncrementItemsError.name;
    }
}
export class UnableToDecrementItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToDecrementItemsError.name;
    }
}
export class UnableToRememberItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRememberItemsError.name;
    }
}
export class UnableToRememberForeverItemsError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRememberItemsError.name;
    }
}
export class UnableToClearError extends UnexpectedCacheError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToClearError.name;
    }
}

export type TCacheValue = string | number | null | boolean | Array<TCacheValue>;
export type ICache = {
    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToGetItemsError}
     */
    get<TValue extends TCacheValue>(key: string): Promise<TValue | null>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToGetItemsError}
     */
    getMany<TValue extends TCacheValue>(
        keys: string[],
    ): Promise<Record<string, TValue | null>>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToGetItemsError}
     */
    getOr<TValue extends TCacheValue>(
        key: string,
        defaultValue: TValue | (() => Promise<TValue>),
    ): Promise<TValue>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToGetItemsError}
     */
    getManyOr<TValue extends TCacheValue>(
        keys: string[],
        defaultValue?: TValue | (() => Promise<TValue>),
    ): Promise<Record<string, TValue>>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToSetItemsError}
     */
    set<TValue extends TCacheValue>(
        key: string,
        value: TValue,
        ttl?: number,
    ): Promise<void>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToSetItemsError}
     */
    setMany<TValue extends TCacheValue>(
        values: Record<string, TValue>,
        ttl?: number,
    ): Promise<void>;

    /**
     * Will update item in cahce if the key does exist
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToUpdateItemsError}
     * @returns Returns true if the key does not exist
     */
    update<TValue extends TCacheValue>(
        key: string,
        value: TValue,
        ttl?: number,
    ): Promise<boolean>;

    /**
     * The same as update method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToUpdateItemsError}
     */
    updateMany<TValue extends TCacheValue>(
        values: Record<string, TValue>,
        ttl?: number,
    ): Promise<Record<string, boolean>>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToRemoveItemsError}
     */
    remove(key: string): Promise<void>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToRemoveItemsError}
     */
    removeMany(keys: string[]): Promise<void>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToCheckForItemsExistenceError}
     */
    has(key: string): Promise<boolean>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToCheckForItemsExistenceError}
     */
    hasMany(keys: string[]): Promise<Record<string, boolean>>;

    /**
     * Retrieve an item from the cache and delete it
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToPullItemsError}
     */
    pull<TValue extends TCacheValue>(key: string): Promise<TValue | null>;

    /**
     * The same as pull method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToPullItemsError}
     */
    pullMany<TValue extends TCacheValue>(
        keys: string[],
    ): Promise<Record<string, TValue | null>>;

    /**
     * Retrieve an item from the cache if found and delete it. Otherwise return default value
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToPullItemsError}
     */
    pullOr<TValue extends TCacheValue>(
        key: string,
        defaultValue: TValue | (() => Promise<TValue>),
    ): Promise<TValue>;

    /**
     * The same as pullOr method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToPullItemsError}
     */
    pullManyOr<TValue extends TCacheValue>(
        keys: string[],
        defaultValue: TValue | (() => Promise<TValue>),
    ): Promise<Record<string, TValue>>;

    /**
     * Store an item in the cache if the key does not exist.
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToAddItemsError}
     * @returns Returns true if key does not exist
     */
    add<TValue extends TCacheValue>(
        key: string,
        value: TValue,
        ttl?: number,
    ): Promise<boolean>;

    /**
     * The same as add method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToAddItemsError}
     */
    addMany<TValue extends TCacheValue>(
        values: Record<string, TValue>,
        ttl?: number,
    ): Promise<Record<string, boolean>>;

    /**
     * Will increment an item in the cache if the key does exist and value is a number
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToIncrementItemsError}
     * @returns Returns true if the key does exist and values is a number
     */
    increment(key: string, value: number, ttl?: number): Promise<boolean>;

    /**
     * The same as increment method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToIncrementItemsError}
     */
    incrementMany(
        values: Record<string, number>,
        ttl?: number,
    ): Promise<Record<string, boolean>>;

    /**
     * Will increment an item in the cache if the key does exist and value is a number
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToDecrementItemsError}
     * @returns Returns true if the key does exist and values is a number
     */
    decrement(key: string, value: number, ttl?: number): Promise<boolean>;

    /**
     * The same as decrement method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToDecrementItemsError}
     */
    decrementMany(
        values: Record<string, number>,
        ttl?: number,
    ): Promise<Record<string, boolean>>;

    /**
     * Store an item in the cache indefinitely
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToAddItemsError}
     */
    setForever<TValue extends TCacheValue>(
        key: string,
        value: TValue,
    ): Promise<void>;

    /**
     * The same as setForever method but can work with multiple keys at the same time
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToAddItemsError}
     */
    setForeverMany<TValue extends TCacheValue>(
        values: Record<string, TValue>,
    ): Promise<void>;

    /**
     * Get an item from the cache, or execute the given Closure and store the result
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToRememberItemsError}
     */
    remember<TValue extends TCacheValue>(
        key: string,
        closure: () => Promise<TValue>,
        ttl?: number,
    ): Promise<TValue>;

    /**
     * Get an item from the cache, or execute the given Closure and store the result
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToRememberItemsError}
     */
    rememberMany<TValue extends TCacheValue>(
        keys: string[],
        closure: () => Promise<TValue>,
        ttl?: number,
    ): Promise<Record<string, TValue>>;

    /**
     * Get an item from the cache, or execute the given Closure and store the result
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToRememberForeverItemsError}
     */
    rememberForever<TValue extends TCacheValue>(
        key: string,
        closure: () => Promise<TValue>,
    ): Promise<TValue>;

    /**
     * Get an item from the cache, or execute the given Closure and store the result
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToRememberForeverItemsError}
     */
    rememberForeverMany<TValue extends TCacheValue>(
        keys: string[],
        closure: () => Promise<TValue>,
    ): Promise<Record<string, TValue>>;

    /**
     * @throws {CacheError}
     * @throws {UnexpectedCacheError}
     * @throws {UnableToClearError}
     */
    clear(): Promise<void>;
};
