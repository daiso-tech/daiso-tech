import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type CollectionError,
    type Filter,
    type ForEach,
    type IComparable,
    type IComparableInternal,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type InvalidTypeError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type ItemNotFoundError,
    type Map,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type MultipleItemsFoundError,
    type Nullable,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type OversteppedMaxSafeIntegerError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type UndersteppedMinSafeIntegerError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type UnexpectedCollectionError,
} from "../shared";

export type Collapse<TValue> = TValue extends
    | Array<infer TItem>
    | Iterable<infer TItem>
    | ICollection<infer TItem>
    ? TItem
    : never;
export type UpdatedItem<TInput, TFilterOutput, TMapOutput> =
    | Exclude<TInput, TFilterOutput>
    | TMapOutput;

export type ICollection<TInput> = Iterable<TInput> &
    IComparableInternal<Iterable<TInput>> &
    IComparable<Iterable<TInput>> & {
        /**
         * The filter method filters the collection using the given callback, keeping only those items that pass a given truth test:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6]);
         * const filtered = collection.filter(item => 2 < item && item < 5);
         * filtered.toArray();
         * // [3, 4]
         */
        filter<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TOutput>;

        /**
         * The map method iterates through the collection and passes each value to the given callback.
         * The mapFunction is free to modify the item and return it, thus forming a new collection of modified items:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]);
         * const mapped = collection.map(item => item * 2);
         * mapped.toArray();
         * // [2, 4, 6, 8, 10]
         */
        map<TOutput>(
            mapFunction: Map<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TOutput>;

        /**
         * The updateItem method filters the collection using the given callback, keeping only those items that pass a given truth test and thereafter updates the filtered items:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]);
         * const updateItemCollection = collection.updateItem(item => item % 2 === 0, item => item * 2);
         * updateItemCollection.toArray();
         * // [1, 4, 3, 8, 5]
         */
        updateItem<TFilterOutput extends TInput, TMapOutput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TFilterOutput>,
            mapFunction: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
        ): ICollection<UpdatedItem<TInput, TFilterOutput, TMapOutput>>;

        /**
         * The collapse method collapses a collection of arrays into a single, flat collection:
         * @example
         * const collection = new Collection([[1, 2], [3, 4]]);
         * const faltend = collection.collapse();
         * faltend.toArray();
         * // [1, 2, 3, 4]
         */
        collapse(): ICollection<Collapse<TInput>>;

        /**
         * The page method returns a new collection containing the items that would be present on a given page number.
         * The method accepts the page number as its first argument and the number of items to show per page as its second argument:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6, 7, 8, 9]);
         * const page = collection.page(2, 3);
         * page.toArray();
         * // [4, 5, 6]
         */
        page(page: number, pageSize: number): ICollection<TInput>;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1, 2, 3]);
         * collection.sum();
         * // 6
         */
        sum(throwWhenIndexExceedsMaxSafeInteger?: boolean): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1, 2, 3]);
         * collection.average();
         * // 2
         */
        average(throwWhenIndexExceedsMaxSafeInteger?: boolean): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6]);
         * collection.median();
         * // 3.5
         */
        median(throwWhenIndexExceedsMaxSafeInteger?: boolean): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6]);
         * collection.min();
         * // 3
         */
        min(throwWhenIndexExceedsMaxSafeInteger?: boolean): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6]);
         * collection.max();
         * // 6
         */
        max(throwWhenIndexExceedsMaxSafeInteger?: boolean): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1n, 2n, 3n]);
         * collection.sum();
         * // 6n
         */
        sumBigint(): bigint;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1n, 2n, 3n]);
         * collection.average();
         * // 2n
         */
        averageBigint(): bigint;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1n, 2n, 3n, 4n, 5n, 6n]);
         * collection.median();
         * // 3n
         */
        medianBigint(): bigint;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1n, 2n, 3n, 4n, 5n, 6n]);
         * collection.min();
         * // 3n
         */
        minBigint(): bigint;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @throws {UndersteppedMinSafeIntegerError} {@link UndersteppedMinSafeIntegerError}
         * @throws {InvalidTypeError} {@link InvalidTypeError}
         * @example
         * const collection = new Collection([1n, 2n, 3n, 4n, 5n, 6n]);
         * collection.max();
         * // 6n
         */
        maxBigint(): bigint;

        /**
         * The some method determines whether the collection some a given item.
         * You must pass a closure to the some method to determine if an element exists in the collection matching a given truth test:
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         * const collection = new Collection([0, 1, 2, 3, 4, 5]);
         * collection.some(item => item === 1);
         * // true
         */
        some<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): boolean;

        /**
         * The every method may be used to verify that all elements of a collection pass a given truth test:
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         * const collection = new Collection([0, 1, 2, 3, 4, 5]);
         * collection.every(item => item < 6);
         * // true
         */
        every<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): boolean;

        /**
         * The take method returns items in the collection until the given callback returns true:
         * @example
         * const collection = new Collection([0, 1, 2, 3, 4, 5]);
         * const chunk = collection.take(3);
         * chunk.toArray();
         * // [0, 1, 2]
         * @example
         * const collection = new Collection([0, 1, 2, 3, 4, 5]);
         * const chunk = collection.take(-2);
         * chunk.toArray();
         * // [4, 5]
         */
        take(
            limit: number,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TInput>;

        /**
         * The takeUntil method returns items in the collection until the given callback returns true:
         * @example
         * const collection = new Collection([1, 2, 3, 4]);
         * const chunk = collection.takeUntil(item => item >= 3);
         * chunk.toArray();
         * // [1, 2]
         */
        takeUntil<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TInput>;

        /**
         * The takeWhile method returns items in the collection until the given callback returns false:
         * @example
         * const collection = new Collection([1, 2, 3, 4]);
         * const chunk = collection.takeWhile(item => item < 3);
         * chunk.toArray();
         * // [1, 2]
         */
        takeWhile<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TInput>;

        /**
         * The skip method returns a new collection, with the given number of elements removed from the beginning of the collection:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).skip(4);
         * collection.toArray();
         * // [5, 6, 7, 8, 9, 10]
         */
        skip(
            offset: number,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TInput>;

        /**
         * The skipUntil method skips over items from the collection until the given callback returns true
         * and then returns the remaining items in the collection as a new collection instance:
         * @example
         * const collection = new Collection([1, 2, 3, 4]).skipUntil(item => item >= 3);
         * collection.toArray();
         * // [3, 4]
         */
        skipUntil<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TInput>;

        /**
         * The skipWhile method skips over items from the collection while the given callback returns false and then returns the remaining items in the collection as a new collection:
         * @example
         * const collection = new Collection([1, 2, 3, 4]).skipWhile(item => item <= 3);
         * collection.toArray();
         * // [4]
         */
        skipWhile<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<TInput>;

        /**
         * The chunk method breaks the collection into multiple, smaller collections of a given size:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6, 7]);
         * const chunks = collection.chunk(4);
         * chunks.toArray();
         * // [[1, 2, 3, 4], [5, 6, 7]]
         */
        chunk(cunkSize: number): ICollection<ICollection<TInput>>;

        /**
         * The chunkWhile method breaks the collection into multiple, smaller collections based on the evaluation of the given callback.
         * The chunk variable passed to the closure may be used to inspect the previous element:
         * @example
         * const collection = new Collection("AABBCCCD".split());
         * const chunks = collection.chunkWhile((value, index, chunk) => {
         *  return value === chunk.last();
         * });
         * chunks.toArray();
         * // [[1, 2, 3, 4], [5, 6, 7]]
         */
        chunkWhile<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<ICollection<TInput>>;

        /**
         * The split method breaks a collection into the given number of groups:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]);
         * const chunks = collection.split(3);
         * chunks.toArray();
         * // [[1, 2], [3, 4], [5]]
         */
        split(chunkSize: number): ICollection<ICollection<TInput>>;

        /**
         * The splitIn method breaks a collection into the given number of groups,
         * filling non-terminal groups completely before allocating the remainder to the final group:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
         * const chunks = collection.splitIn(3);
         * chunks.toArray();
         * // [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
         */
        splitIn(chunkSize: number): ICollection<ICollection<TInput>>;

        /**
         * The partition method may be combined with PHP array destructuring to separate elements that pass a given truth test from those that do not:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6]);
         * collection.partition(item => item < 3);
         * // [[1, 2], [3, 4, 5, 6]]
         */
        partition<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): ICollection<ICollection<TInput>>;

        /**
         * The sliding method returns a new collection of chunks representing a "sliding window" view of the items in the collection:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]).sliding(2);
         * collection.toArray();
         * // [[1, 2], [2, 3], [3, 4], [4, 5]]
         */
        sliding(chunkSize: number): ICollection<ICollection<TInput>>;

        /**
         * The unique method returns all of the unique items in the collection:
         * @example
         * const collection = new Collection([1, 1, 2, 2, 3, 4, 2]);
         * collection.unique().toArray();
         * // [1, 2, 3, 4]
         */
        unique(): ICollection<TInput>;

        /**
         * The duplicates method retrieves and returns duplicate values from the collection:
         * @example
         * const collection = new Collection(["a", "b", "a", "c", "b"]);
         * collection.duplicates().toArray();
         * // ["b"]
         */
        duplicates(): ICollection<TInput>;

        /**
         * The prependStrict method adds an item to the beginning of the collection:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]).prependStrict([-1, 20]);
         * collection.toArray();
         * // [-1, 20, 1, 2, 3, 4, 5]
         */
        prependStrict(iterable: Iterable<TInput>): ICollection<TInput>;

        /**
         * The prepend method is the same prependStrict but not strict with types:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]).prepend(["-1", "20"]);
         * collection.toArray();
         * // ["-1", "20", 1, 2, 3, 4, 5]
         */
        prepend<TExtended = TInput>(
            iterable: Iterable<TInput | TExtended>,
        ): ICollection<TInput | TExtended>;

        /**
         * The appendStrict method adds an item to the beginning of the collection:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]).appendStrict([-1, -2]);
         * collection.toArray();
         * // [1, 2, 3, 4, 5, -1, -2,]
         */
        appendStrict(iterable: Iterable<TInput>): ICollection<TInput>;

        /**
         * The append method is the same appendStrict but not strict with types:
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]).append(["-1", "-2"]);
         * collection.toArray();
         * // [1, 2, 3, 4, 5, "-1", "-2",]
         */
        append<TExtended = TInput>(
            iterable: Iterable<TInput | TExtended>,
        ): ICollection<TInput | TExtended>;

        /**
         * The zip method merges together the values of the given array with the values of the original collection at their corresponding index:
         * @example
         * const collection = new Collection(["Chair", "Desk"]);
         * const zipped = collection.zip([100, 200]);
         * zipped.toArray();
         * // [["Chari", 100], ["Desk", 200]]
         */
        zip<TExtended>(
            iterable: Iterable<TExtended>,
        ): ICollection<ICollection<TInput | TExtended>>;

        /**
         * The first method returns the first element in the collection that passes a given truth test. By default it will get the first element:
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         * const collection = new Collection([1, 2, 3, 4]);
         * collection.first(item => item > 2);
         * // 3
         */
        first<TOutput extends TInput>(
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): Nullable<TOutput>;

        /**
         * The firstOrStrict method is the same as first method but will return an default value if not found
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         */
        firstOrStrict<TOutput extends TInput>(
            defaultValue: TInput | (() => TInput),
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput;

        /**
         * The firstOr method is the same as firstOrStrict method but is not strict with types
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         */
        firstOr<TOutput extends TInput, TExtended = TInput>(
            defaultValue: TExtended | (() => TExtended),
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput | TExtended;

        /**
         * The firstOrFail method is the same as first method but will throw an Error if not found
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {ItemNotFoundError} {@link ItemNotFoundError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         */
        firstOrFail<TOutput extends TInput>(
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput;

        /**
         * The last method returns the last element in the collection that passes a given truth test. By default it will get the last element:
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         * const collection = new Collection([1, 2, 3, 4]);
         * collection.last(item => item > 2);
         * // 4
         */
        last<TOutput extends TInput>(
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): Nullable<TOutput>;

        /**
         * The lastOrStrict method is the same as last method but will return an default value if not found
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         */
        lastOrStrict<TOutput extends TInput>(
            defaultValue: TInput | (() => TInput),
            filterFunction?: Filter<TInput, ICollection<TOutput>>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput;

        /**
         * The lastOr method is the same as lastOrStrict method but is not strict with types
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         */
        lastOr<TOutput extends TInput, TExtended = TInput>(
            defaultValue: TExtended | (() => TExtended),
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput | TExtended;

        /**
         * The lastOrFail method is the same as last method but will throw an Error if not found
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {ItemNotFoundError} {@link ItemNotFoundError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         */
        lastOrFail<TOutput extends TInput>(
            filterFunction?: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput;

        /**
         * The sole method returns the first element in the collection that passes a given truth test, but only if the truth test matches exactly one element:
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {ItemNotFoundError} {@link ItemNotFoundError}
         * @throws {MultipleItemsFoundError} {@link MultipleItemsFoundError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5]);
         * collection.sole(item => item === 4);
         * // 4
         */
        sole<TOutput extends TInput>(
            filterFunction: Filter<TInput, ICollection<TInput>, TOutput>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): TOutput;

        /**
         * The nth method creates a new collection consisting of every n-th element:
         * @example
         * const collection = new Collection([["a", "b", "c", "d", "e", "f"]]).nth();
         * collection.toArray();
         * // ["a", "e"]
         */
        nth(step: number): ICollection<TInput>;

        /**
         * The count method returns the total number of items in the collection:
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         * @example
         * const collection = new Collection([1, 2, 3, 4, 5, 6]);
         * collection.count(value => value % 2 === 0);
         * // 3
         */
        count(
            filterFunction: Filter<TInput, ICollection<TInput>>,
            throwWhenIndexExceedsMaxSafeInteger?: boolean,
        ): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         */
        size(): number;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         */
        empty(): boolean;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         */
        forEach(callback: ForEach<TInput, ICollection<TInput>>): void;

        /**
         * @throws {CollectionError} {@link CollectionError}
         * @throws {UnexpectedCollectionError} {@link UnexpectedCollectionError}
         * @throws {OversteppedMaxSafeIntegerError} {@link OversteppedMaxSafeIntegerError}
         */
        toArray(): TInput[];

        iterator(): Iterable<TInput>;
    };
