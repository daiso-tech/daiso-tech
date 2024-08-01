import { describe, expect, test } from "vitest";

import {
    CollectionError,
    InvalidTypeError,
    ItemNotFoundError,
    MultipleItemsFoundError,
    RecordItem,
} from "../../../shared";
import { ListCollection } from "./list-collection";

describe("class: ListCollection", () => {
    describe("method: filter", () => {
        test(`Should filter out all "a" of ["a", "bc", "c", "a", "d", "a"]`, () => {
            const arr = ["a", "bc", "c", "a", "d", "a"];
            const collection = new ListCollection(arr);
            const filterFunction = (item: string): boolean => item === "a";
            const newCollection = collection.filter(filterFunction);
            expect(newCollection.toArray()).toEqual(arr.filter(filterFunction));
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "bc",
                "c",
                "a",
                "d",
                "a",
            ]);
            const indexes: number[] = [];
            const filterFunction = (item: string, index: number): boolean => {
                indexes.push(index);
                return item === "a";
            };
            collection.filter(filterFunction).toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
    });
    describe("method: map", () => {
        test("Should apply power by 2 for all items", () => {
            const arr = [2, 3, 4, 5];
            const collection = new ListCollection(arr);
            const mapFunction = (item: number): number => Math.pow(item, 2);
            const newCollection = collection.map(mapFunction);
            expect(newCollection.toArray()).toEqual(arr.map(mapFunction));
        });
        test("Should input correct indexes to map function", () => {
            const collection = new ListCollection([2, 3, 4, 5]);
            const indexes: number[] = [];
            const mapFunction = (item: number, index: number): number => {
                indexes.push(index);
                return Math.pow(item, 2);
            };
            collection.map(mapFunction).toArray();
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
    });
    describe("method: reduce", () => {
        test("Should join all string items without initial values", () => {
            const arr = ["a", "b", "c", "d"];
            const collection = new ListCollection(arr);
            const seperator = "_#_";
            const result = collection.reduce({
                reduce(firstItem, item) {
                    return firstItem + seperator + item;
                },
            });
            expect(result).toBe(arr.join(seperator));
        });
        test(`Should join all string items initial value "_#_"`, () => {
            const arr = ["a", "b", "c", "d"];
            const collection = new ListCollection(arr);
            const initialValue = "!";
            const result = collection.reduce({
                reduce(initialValue, item) {
                    return initialValue + item;
                },
                initialValue,
            });
            expect(result).toBe(initialValue + arr.join(""));
        });
        test("Should input correct indexes to reduce function", () => {
            const arr = ["a", "b", "c", "d"];
            const collection = new ListCollection(arr);
            const initialValue = "!";
            const indexes: number[] = [];
            collection.reduce({
                reduce(initialValue, item, index) {
                    indexes.push(index);
                    return initialValue + item;
                },
                initialValue,
            });
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
        test("Should throw invalid type error when given an empty array without initial value", () => {
            const collection = new ListCollection<string>([]);
            expect(() => {
                collection.reduce({
                    reduce: (a, b) => a + b,
                });
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const arr = ["a", "b", "c", "d"];
            const collection = new ListCollection(arr);
            const seperator = "_#_";
            expect(
                collection.reduce({
                    reduce(firstItem, item) {
                        return firstItem + seperator + item;
                    },
                }),
            ).toBe(arr.join(seperator));
            expect(
                collection.reduce({
                    reduce(firstItem, item) {
                        return firstItem + seperator + item;
                    },
                }),
            ).toBe(arr.join(seperator));
        });
    });
    describe("method: join", () => {
        test(`Should join iterable of ["a", "b", "c"] to "a,b,c"`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.join()).toBe("a,b,c");
        });
        test(`Should join iterable of ["a", "b", "c"] to "a,b,c" with seperator "_#_"`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(
                collection.join({
                    seperator: "_#_",
                }),
            ).toBe("a_#_b_#_c");
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.join()).toBe("a,b,c");
            expect(collection.join()).toBe("a,b,c");
        });
    });
    describe("method: flatMap", () => {
        test("Should apply flatmap", () => {
            const collection = new ListCollection(["a", "ab", "b", "ba"]);
            const newCollection = collection.flatMap((item, index) => [
                index,
                item,
                item.length,
            ]);
            expect(newCollection.toArray()).toEqual([
                0,
                "a",
                1,
                1,
                "ab",
                2,
                2,
                "b",
                1,
                3,
                "ba",
                2,
            ]);
        });
        test("Should input correct indexes to map function", () => {
            const collection = new ListCollection(["a", "ab", "b", "ba"]);
            const indexes: number[] = [];
            const mapFunction = (
                item: string,
                index: number,
            ): [number, string, number] => {
                indexes.push(index);
                return [index, item, item.length];
            };
            collection.flatMap(mapFunction).toArray();
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
    });
    describe("method: update", () => {
        test("Should change all the items that match the filter function", () => {
            const collection = new ListCollection([
                "a",
                "aa",
                "b",
                "bbb",
                "c",
                "cccc",
            ]);
            const newCollection = collection.update(
                (item) => item.length >= 2,
                (item) => item.slice(0, -1),
            );
            expect(newCollection.toArray()).toEqual([
                "a",
                "a",
                "b",
                "bb",
                "c",
                "ccc",
            ]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "aa",
                "b",
                "bbb",
                "c",
                "cccc",
            ]);
            const indexes: number[] = [];
            collection
                .update(
                    (item, index) => {
                        indexes.push(index);
                        return item.length >= 2;
                    },
                    (item) => item.slice(0, -1),
                )
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
        test("Should input correct indexes to map function", () => {
            const collection = new ListCollection([
                "a",
                "aa",
                "b",
                "bbb",
                "c",
                "cccc",
            ]);
            const indexes: number[] = [];
            collection
                .update(
                    (item) => item.length >= 2,
                    (item, index) => {
                        indexes.push(index);
                        return item.slice(0, -1);
                    },
                )
                .toArray();
            expect(indexes).toEqual([1, 3, 5]);
        });
    });
    describe("method: page", () => {
        test("Should return the first 4 items when page is 1 and pageSize 4", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: 1,
                pageSize: 4,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(0, 4));
        });
        test("Should return the last 4 items when page is 2 and pageSize 4", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: 2,
                pageSize: 4,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(-4));
        });
        test("Should return the last 4 items when page is -1 and pageSize 4", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: -1,
                pageSize: 4,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(-4));
        });
        test("Should return the first 2 items when page is 1 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: 1,
                pageSize: 2,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(0, 2));
        });
        test("Should return the last 2 items when page is 4 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: 4,
                pageSize: 2,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
        test("Should return the last 2 items when page is -1 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: -1,
                pageSize: 2,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
        test("Should return the last 2 items when page is -1 and pageSize 2", () => {
            const arr = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const collection = new ListCollection(arr);
            const newCollection = collection.page({
                page: -2,
                pageSize: 2,
            });
            expect(newCollection.toArray()).toEqual(arr.slice(-4, -2));
        });
    });
    describe("method: sum", () => {
        test("Should calculate sum iterable of [1, 2, 3, 4] to 10", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.sum()).toBe(10);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.sum();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.sum();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.sum()).toBe(10);
            expect(collection.sum()).toBe(10);
        });
    });
    describe("method: average", () => {
        test("Should calculate average iterable of [1, 2, 3, 4] to 2.5", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.average()).toBe(2.5);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.average();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.average();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            expect(collection.average()).toBe(2.5);
            expect(collection.average()).toBe(2.5);
        });
    });
    describe("method: median", () => {
        test("Should calculate median iterable of [1, 2, 3, 4, 5] to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.median()).toBe(3);
        });
        test("Should calculate median iterable of [1, 2, 4, 5] to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.median()).toBe(3);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.median();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.median();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.median()).toBe(3);
            expect(collection.median()).toBe(3);
        });
    });
    describe("method: min", () => {
        test("Should return the smallest number", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.min()).toBe(-2);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4, "-4"]);
            expect(() => {
                collection.min();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4, "-4"]);
            expect(() => {
                collection.min();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.min()).toBe(-2);
            expect(collection.min()).toBe(-2);
        });
    });
    describe("method: max", () => {
        test("Should return the largest number", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.max()).toBe(4);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4, "-4"]);
            expect(() => {
                collection.max();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4, "-4"]);
            expect(() => {
                collection.max();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([2, 1, 3, -2, 4]);
            expect(collection.max()).toBe(4);
            expect(collection.max()).toBe(4);
        });
    });
    describe("method: sumBigint", () => {
        test("Should calculate sum iterable of [1, 2, 3, 4] to 10", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n]);
            expect(collection.sumBigint()).toBe(10n);
        });
        test("Should throw CollectionError when containg a none bigint item", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, "a"]);
            expect(() => {
                collection.sumBigint();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none bigint item", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, "a"]);
            expect(() => {
                collection.sumBigint();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n]);
            expect(collection.sumBigint()).toBe(10n);
            expect(collection.sumBigint()).toBe(10n);
        });
    });
    describe("method: averageBigint", () => {
        test("Should calculate average iterable of [1, 2, 3, 4] to 2.5", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n]);
            expect(collection.averageBigint()).toBe(2n);
        });
        test("Should throw CollectionError when containg a none bigint item", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, "a"]);
            expect(() => {
                collection.averageBigint();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none bigint item", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, "a"]);
            expect(() => {
                collection.averageBigint();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n]);
            expect(collection.averageBigint()).toBe(2n);
            expect(collection.averageBigint()).toBe(2n);
        });
    });
    describe("method: medianBigint", () => {
        test("Should calculate median iterable of [1, 2, 3, 4, 5] to 3", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, 5n]);
            expect(collection.medianBigint()).toBe(3n);
        });
        test("Should calculate median iterable of [1, 2, 4, 5] to 3", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, 5n]);
            expect(collection.medianBigint()).toBe(3n);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, "a"]);
            expect(() => {
                collection.medianBigint();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([1, 2, 3, 4, "a"]);
            expect(() => {
                collection.medianBigint();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1n, 2n, 3n, 4n, 5n]);
            expect(collection.medianBigint()).toBe(3n);
            expect(collection.medianBigint()).toBe(3n);
        });
    });
    describe("method: minBigint", () => {
        test("Should return the smallest number", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n]);
            expect(collection.minBigint()).toBe(-2n);
        });
        test("Should throw CollectionError when containg a none number item", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n, "-4"]);
            expect(() => {
                collection.minBigint();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none number item", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n, "-4"]);
            expect(() => {
                collection.minBigint();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n]);
            expect(collection.minBigint()).toBe(-2n);
            expect(collection.minBigint()).toBe(-2n);
        });
    });
    describe("method: maxBigint", () => {
        test("Should return the largest number", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n]);
            expect(collection.maxBigint()).toBe(4n);
        });
        test("Should throw CollectionError when containg a none bigint item", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n, "-4"]);
            expect(() => {
                collection.maxBigint();
            }).toThrowError(CollectionError);
        });
        test("Should throw InvalidTypeError when containg a none bigint item", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n, "-4"]);
            expect(() => {
                collection.maxBigint();
            }).toThrowError(InvalidTypeError);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([2n, 1n, 3n, -2n, 4n]);
            expect(collection.maxBigint()).toBe(4n);
            expect(collection.maxBigint()).toBe(4n);
        });
    });
    describe("method: percentage", () => {
        test(`Should return 50 when filtering "a" of ["a", "b", "a", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "a", "b"]);
            expect(collection.percentage((item) => item === "a")).toBe(50);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "bc",
                "c",
                "a",
                "d",
                "a",
            ]);
            const indexes: number[] = [];
            const filterFunction = (item: string, index: number): boolean => {
                indexes.push(index);
                return item === "a";
            };
            collection.percentage(filterFunction);
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "a", "b"]);
            expect(collection.percentage((item) => item === "a")).toBe(50);
            expect(collection.percentage((item) => item === "a")).toBe(50);
        });
    });
    describe("method: some", () => {
        test("Should return true when at least 1 item match the filter function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.some((item) => item === "b")).toBe(true);
        });
        test("Should return false when all of the items does not match the filter function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.some((item) => item === "d")).toBe(false);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "bc",
                "c",
                "a",
                "d",
                "a",
            ]);
            const indexes: number[] = [];
            const filterFunction = (item: string, index: number): boolean => {
                indexes.push(index);
                return item === "a";
            };
            collection.every(filterFunction);
            expect(indexes).toEqual([0, 1]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.some((item) => item === "b")).toBe(true);
            expect(collection.some((item) => item === "b")).toBe(true);
        });
    });
    describe("method: every", () => {
        test("Should return true when all items match the filter function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.every((item) => item.length === 1)).toBe(true);
        });
        test("Should return false when one item does not match the filter function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "aa"]);
            expect(collection.every((item) => item.length === 1)).toBe(false);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "aa"]);
            const indexes: number[] = [];
            collection.every((item, index) => {
                indexes.push(index);
                return item.length === 1;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c", "c", "a"]);
            expect(collection.every((item) => item.length === 1)).toBe(true);
            expect(collection.every((item) => item.length === 1)).toBe(true);
        });
    });
    describe("method: take", () => {
        test("Should take first item when input is 1", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.take(1);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 1));
        });
        test("Should take 5 first items when input is 5", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.take(5);
            expect(newCollection.toArray()).toEqual(arr.slice(0, 5));
        });
        test("Should take 8 first items when input is -2", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.take(-2);
            expect(newCollection.toArray()).toEqual(arr.slice(0, -2));
        });
    });
    describe("method: takeUntil", () => {
        test("Should take all items until item is larger or equal to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const newCollection = collection.takeUntil((item) => item >= 3);
            expect(newCollection.toArray()).toEqual([1, 2]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const indexes: number[] = [];
            collection
                .takeUntil((item, index) => {
                    indexes.push(index);
                    return item >= 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2]);
        });
    });
    describe("method: takeWhile", () => {
        test("Should take all items while item is less than 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const newCollection = collection.takeWhile((item) => item < 3);
            expect(newCollection.toArray()).toEqual([1, 2]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const indexes: number[] = [];
            collection
                .takeWhile((item, index) => {
                    indexes.push(index);
                    return item < 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2]);
        });
    });
    describe("method: skip", () => {
        test("Should skip first item when input is 1", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.skip(1);
            expect(newCollection.toArray()).toEqual(arr.slice(1));
        });
        test("Should skip 5 first items when input is 5", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.skip(5);
            expect(newCollection.toArray()).toEqual(arr.slice(5));
        });
        test("Should skip 8 first items when input is -2", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.skip(-2);
            expect(newCollection.toArray()).toEqual(arr.slice(-2));
        });
    });
    describe("method: skipUntil", () => {
        test("Should skip all items until item is larger or equal to 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const newCollection = collection.skipUntil((item) => item >= 3);
            expect(newCollection.toArray()).toEqual([3, 4]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const indexes: number[] = [];
            collection
                .skipUntil((item, index) => {
                    indexes.push(index);
                    return item >= 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2]);
        });
    });
    describe("method: skipWhile", () => {
        test("Should skipp all items while item is less than 3", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const newCollection = collection.skipWhile((item) => item <= 3);
            expect(newCollection.toArray()).toEqual([4]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4]);
            const indexes: number[] = [];
            collection
                .skipWhile((item, index) => {
                    indexes.push(index);
                    return item <= 3;
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3]);
        });
    });
    describe("method: when", () => {
        test("Should append items when statement is true", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.when(true, (collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should not append items when statement is false", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.when(false, (collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: whenEmpty", () => {
        test("Should append items when empty", () => {
            const collection = new ListCollection<string>([]);
            const arr2 = [1, 2, 3];
            const newCollection = collection.whenEmpty((collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual(arr2);
        });
        test("Should not append items when not empty", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.whenEmpty((collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: whenNot", () => {
        test("Should append items when statement is false", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.whenNot(false, (collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should not append items when statement is true", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.whenNot(true, (collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: whenNotEmpty", () => {
        test("Should append items when not empty", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.whenNotEmpty((collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should not append items when empty", () => {
            const collection = new ListCollection([]);
            const arr2 = [1, 2, 3];
            const newCollection = collection.whenNotEmpty((collection) =>
                collection.append(arr2),
            );
            expect(newCollection.toArray()).toEqual([]);
        });
    });
    describe("method: pipe", () => {
        test("Should pipe multiple functions", () => {
            const collection = new ListCollection(["a", "ab", "abc", "abcd"]);
            const result = collection
                .pipe((collection) =>
                    collection.map((item) =>
                        new ListCollection(item).map((char) =>
                            char.charCodeAt(0),
                        ),
                    ),
                )
                .pipe((collection) =>
                    collection.map((collection) => collection.sum()),
                )
                .pipe((collection) => collection.sum());
            expect(result).toBeTypeOf("number");
        });
    });
    describe("method: tap", () => {
        test("Should change the original collection", () => {
            const arr = ["a", "ab", "abc"];
            const collection = new ListCollection(arr).tap((collection) =>
                collection.map((item) => item.length),
            );
            expect(collection.toArray()).toEqual(arr);
        });
    });
    describe("method: chunk", () => {
        test("Should group items into groups of size 1", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8];
            const collection = new ListCollection(arr);
            const newCollection = collection.chunk(1);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual(arr.map((item) => [item]));
        });
        test("Should group items into groups of size 4", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8];
            const collection = new ListCollection(arr);
            const newCollection = collection.chunk(4);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 4), arr.slice(4)]);
        });
    });
    describe("method: chunkWhile", () => {
        test("Should group items by checking if next item is the same as the current item", () => {
            const collection = new ListCollection("AABBCCCD".split(""));
            const newCollection = collection.chunkWhile(
                (value, _index, chunk) => {
                    return value === chunk.last();
                },
            );
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["A", "A"], ["B", "B"], ["C", "C", "C"], ["D"]]);
        });
    });
    describe("method: split", () => {
        test("Should split items into 3 groups in equal size when size is 9", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const collection = new ListCollection(arr);
            const newCollection = collection.split(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 3), arr.slice(3, 6), arr.slice(6, 9)]);
        });
        test("Should split items into 3 groups where the first group have on item more when size is 10", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const collection = new ListCollection(arr);
            const newCollection = collection.split(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 4), arr.slice(4, 7), arr.slice(7, 10)]);
        });
        test("Should split items into 3 groups where the first and second group have on item more when size is 11", () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            const collection = new ListCollection(arr);
            const newCollection = collection.split(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([arr.slice(0, 4), arr.slice(4, 8), arr.slice(8, 11)]);
        });
    });
    describe("method: partition", () => {
        test("Should group items into strings and number", () => {
            const arr = ["a", 1, "b", 2, "c", 3, "d", 4, "e", 5];
            const collection = new ListCollection(arr);
            const newCollection = collection.partition(
                (item) => typeof item === "string",
            );
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                arr.filter((item) => typeof item === "string"),
                arr.filter((item) => typeof item === "number"),
            ]);
        });
        test("Should input correct indexes to filter function", () => {
            const arr = ["a", 1, "b", 2, "c", 3, "d", 4, "e", 5];
            const collection = new ListCollection(arr);
            const indexes: number[] = [];
            collection
                .partition((item, index) => {
                    indexes.push(index);
                    return typeof item === "string";
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });
    describe.todo("method: sliding", () => {
        test("Should group items into 7 groups when size is 2", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b"],
                ["b", "c"],
                ["c", "d"],
                ["d", "e"],
                ["e", "f"],
                ["f", "g"],
                ["g", "h"],
            ]);
        });
        test("Should group items into 4 groups when size is 3", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b", "c"],
                ["c", "d", "e"],
                ["e", "f", "g"],
                ["g", "h"],
            ]);
        });
        test("Should group items into 6 groups when size is 3 and step is 1", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(3, 1);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b", "c"],
                ["b", "c", "d"],
                ["c", "d", "e"],
                ["d", "e", "f"],
                ["e", "f", "g"],
                ["f", "g", "h"],
            ]);
        });
        test("Should group items into 6 groups when size is 4 and step is 2", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(4, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([
                ["a", "b", "c", "d"],
                ["c", "d", "e", "f"],
                ["e", "f", "g", "h"],
            ]);
        });
        test("Should group items into 4 groups when size is 1 and step is 2", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(1, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a"], ["c"], ["e"], ["g"]]);
        });
        test("Should group items into 3 groups when size is 1 and step is 3", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(1, 3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a"], ["d"], ["g"]]);
        });
        test("Should group items into 2 groups when size is 1 and step is 4", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(1, 3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a"], ["e"]]);
        });
        test("Should group items into 1 groups when size is 2 and step is 1 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]);
            const newCollection = collection.sliding(2, 1);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should group items into 1 groups when size is 2 and step is 2 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]);
            const newCollection = collection.sliding(2, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should group items into 1 groups when size is 3 and step is 2 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]);
            const newCollection = collection.sliding(2, 3);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should group items into 1 groups when size is 2 and step is 3 and array size is 2", () => {
            const collection = new ListCollection(["a", "b"]);
            const newCollection = collection.sliding(3, 2);
            expect(
                newCollection.map((item) => item.toArray()).toArray(),
            ).toEqual([["a", "b"]]);
        });
        test("Should return empty collection when size is 1", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
            ]);
            const newCollection = collection.sliding(1);
            expect(newCollection.toArray()).toEqual([]);
        });
    });
    describe("method: groupBy", () => {
        test("Should group by with default map function", () => {
            const arr = ["a", "b", "c", "a", "b", "c", "b", "d"];
            const collection = new ListCollection(arr);
            const newCollection = collection.groupBy();
            expect(
                newCollection
                    .map(
                        ([key, item]): RecordItem<string, string[]> => [
                            key,
                            item.toArray(),
                        ],
                    )
                    .toArray(),
            ).toEqual([
                ["a", arr.filter((item) => item === "a")],
                ["b", arr.filter((item) => item === "b")],
                ["c", arr.filter((item) => item === "c")],
                ["d", arr.filter((item) => item === "d")],
            ]);
        });
        test("Should group by with custom map function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const arr: Person[] = [
                {
                    name: "Abra",
                    age: 20,
                },
                {
                    name: "Asmail",
                    age: 34,
                },
                {
                    name: "Ibra",
                    age: 50,
                },
                {
                    name: "Asmail",
                    age: 21,
                },
                {
                    name: "Abra",
                    age: 32,
                },
                {
                    name: "Abra",
                    age: 67,
                },
            ];
            const collection = new ListCollection<Person>(arr);
            const newCollection = collection.groupBy({
                map(item) {
                    return item.name;
                },
            });
            expect(
                newCollection
                    .map(
                        ([key, item]): RecordItem<string, Person[]> => [
                            key,
                            item.toArray(),
                        ],
                    )
                    .toArray(),
            ).toEqual([
                ["Abra", arr.filter((item) => item.name === "Abra")],
                ["Asmail", arr.filter((item) => item.name === "Asmail")],
                ["Ibra", arr.filter((item) => item.name === "Ibra")],
            ]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "a",
                "b",
                "c",
                "b",
                "d",
            ]);
            const indexes: number[] = [];
            collection
                .groupBy({
                    map: (item, index) => {
                        indexes.push(index);
                        return item;
                    },
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
    describe("method: countBy", () => {
        test("Should count by with default map function", () => {
            const arr = ["a", "b", "c", "a", "b", "c", "b", "d"];
            const collection = new ListCollection(arr);
            const newCollection = collection.countBy();
            expect(newCollection.toArray()).toEqual([
                ["a", arr.filter((item) => item === "a").length],
                ["b", arr.filter((item) => item === "b").length],
                ["c", arr.filter((item) => item === "c").length],
                ["d", arr.filter((item) => item === "d").length],
            ]);
        });
        test("Should count by with custom map function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const arr: Person[] = [
                {
                    name: "Abra",
                    age: 20,
                },
                {
                    name: "Asmail",
                    age: 34,
                },
                {
                    name: "Ibra",
                    age: 50,
                },
                {
                    name: "Asmail",
                    age: 21,
                },
                {
                    name: "Abra",
                    age: 32,
                },
                {
                    name: "Abra",
                    age: 67,
                },
            ];
            const collection = new ListCollection<Person>(arr);
            const newCollection = collection.countBy({
                map(item) {
                    return item.name;
                },
            });
            expect(newCollection.toArray()).toEqual([
                ["Abra", arr.filter((item) => item.name === "Abra").length],
                ["Asmail", arr.filter((item) => item.name === "Asmail").length],
                ["Ibra", arr.filter((item) => item.name === "Ibra").length],
            ]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "a",
                "b",
                "c",
                "b",
                "d",
            ]);
            const indexes: number[] = [];
            collection
                .countBy({
                    map: (item, index) => {
                        indexes.push(index);
                        return item;
                    },
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
    describe("method: unique", () => {
        test("Should return unique items with default map function", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "a",
                "b",
                "c",
            ]);
            const newCollection = collection.unique();
            expect(newCollection.toArray()).toEqual(["a", "b", "c"]);
        });
        test("Should return unique items with custom map function", () => {
            const collection = new ListCollection([
                "a",
                "bb",
                "cc",
                "acc",
                "b",
                "cccc",
            ]);
            const newCollection = collection.unique({
                map(item) {
                    return item.length;
                },
            });
            expect(newCollection.toArray()).toEqual(["a", "bb", "acc", "cccc"]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "a",
                "b",
                "c",
                "b",
                "d",
            ]);
            const indexes: number[] = [];
            collection
                .unique({
                    map: (item, index) => {
                        indexes.push(index);
                        return item;
                    },
                })
                .toArray();
            expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        });
    });
    describe("method: prepend", () => {
        test("Should prepend iterable", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const prependedCollection = collection.prepend(arr2);
            expect(prependedCollection.toArray()).toEqual([...arr2, ...arr1]);
        });
    });
    describe("method: append", () => {
        test("Should append iterable", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const appendedCollection = collection.append(arr2);
            expect(appendedCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
    });
    describe("method: insertBefore", () => {
        test("Should insert iterable before first item", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.insertBefore(
                (item) => item === "a",
                arr2,
            );
            expect(newCollection.toArray()).toEqual([...arr2, ...arr1]);
        });
        test("Should insert iterable before last item", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.insertBefore(
                (item) => item === "c",
                arr2,
            );
            expect(newCollection.toArray()).toEqual([
                ...arr1.slice(0, -1),
                ...arr2,
                ...arr1.slice(-1),
            ]);
        });
        test("Should not insert iterable if filter item not found", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.insertBefore(
                (item) => item === "d",
                arr2,
            );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: insertAfter", () => {
        test("Should insert iterable after last item", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.insertAfter(
                (item) => item === "c",
                arr2,
            );
            expect(newCollection.toArray()).toEqual([...arr1, ...arr2]);
        });
        test("Should insert iterable after first item", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.insertAfter(
                (item) => item === "a",
                arr2,
            );
            expect(newCollection.toArray()).toEqual([
                ...arr1.slice(0, 1),
                ...arr2,
                ...arr1.slice(-2),
            ]);
        });
        test("Should not insert iterable if filter item not found", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.insertAfter(
                (item) => item === "d",
                arr2,
            );
            expect(newCollection.toArray()).toEqual(arr1);
        });
    });
    describe("method: zip", () => {
        test("Should zip iterable", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.zip(arr2);
            expect(newCollection.toArray()).toEqual([
                [arr1[0], arr2[0]],
                [arr1[1], arr2[1]],
                [arr1[2], arr2[2]],
            ]);
        });
        test("Should have the length of collection", () => {
            const arr1 = ["a", "b", "c", "d"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3];
            const newCollection = collection.zip(arr2);
            expect(newCollection.toArray()).toEqual([
                [arr1[0], arr2[0]],
                [arr1[1], arr2[1]],
                [arr1[2], arr2[2]],
            ]);
        });
        test("Should have the length of input iterable", () => {
            const arr1 = ["a", "b", "c"];
            const collection = new ListCollection(arr1);
            const arr2 = [1, 2, 3, 4];
            const newCollection = collection.zip(arr2);
            expect(newCollection.toArray()).toEqual([
                [arr1[0], arr2[0]],
                [arr1[1], arr2[1]],
                [arr1[2], arr2[2]],
            ]);
        });
    });
    describe("method: sort", () => {
        test("Sort numbers from smallest to largest with custom comparator function", () => {
            const arr = [-1, 2, 1, -3, 4, 20, 15, -5, -3];
            const collection = new ListCollection(arr);
            const newCollection = collection.sort((a, b) => a - b);
            expect(newCollection.toArray()).toEqual(
                arr.toSorted((a, b) => a - b),
            );
        });
        test("Sort numbers from smallest to largest with default compartor function", () => {
            const arr = [-1, 2, 1, -3, 4, 20, 15, -5, -3];
            const collection = new ListCollection(arr);
            const newCollection = collection.sort();
            expect(newCollection.toArray()).toEqual(arr.toSorted());
        });
    });
    describe("method: reverse", () => {
        test("Should reverse iterable", () => {
            const arr = ["a", "b", "c", "d", "e", "f"];
            const collection = new ListCollection(arr);
            const newCollection = collection.reverse();
            expect(newCollection.toArray()).toEqual(arr.toReversed());
        });
    });
    describe("method: first", () => {
        test("Should return first item that matches the filter function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Person[] = [
                {
                    name: "Joe",
                    age: 20,
                },
                {
                    name: "Jhon",
                    age: 23,
                },
                {
                    name: "Joe",
                    age: 30,
                },
                {
                    name: "Jhon",
                    age: 50,
                },
            ];
            const collection = new ListCollection(persons);
            const item = collection.first({
                filter: (person) => person.name === "Joe",
            });
            expect(item).toEqual(persons[0]);
        });
        test("Should return first item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.first();
            expect(item).toBe(1);
        });
        test("Should return null when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.first({
                filter: (item) => item === 6,
            });
            expect(item).toBe(null);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const indexes: number[] = [];
            collection.first({
                filter: (item, index) => {
                    indexes.push(index);
                    return item === 6;
                },
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.first()).toBe(1);
            expect(collection.first()).toBe(1);
        });
    });
    describe("method: firstOr", () => {
        test("Should return first item that matches the filter function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Person[] = [
                {
                    name: "Joe",
                    age: 20,
                },
                {
                    name: "Jhon",
                    age: 23,
                },
                {
                    name: "Joe",
                    age: 30,
                },
                {
                    name: "Jhon",
                    age: 50,
                },
            ];
            const collection = new ListCollection(persons);
            const item = collection.firstOr({
                defaultValue: null,
                filter: (person) => person.name === "Joe",
            });
            expect(item).toEqual(persons[0]);
        });
        test("Should return first item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.firstOr({
                defaultValue: "a",
            });
            expect(item).toBe(1);
        });
        test("Should return default value when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.firstOr({
                defaultValue: "a",
                filter: (item) => item === 6,
            });
            expect(item).toBe("a");
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const indexes: number[] = [];
            collection.firstOr({
                defaultValue: null,
                filter: (item, index) => {
                    indexes.push(index);
                    return item === 6;
                },
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(
                collection.firstOr({
                    defaultValue: "a",
                }),
            ).toBe(1);
            expect(
                collection.firstOr({
                    defaultValue: "a",
                }),
            ).toBe(1);
        });
    });
    describe("method: firstOrFail", () => {
        test("Should return first item that matches the filter function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Person[] = [
                {
                    name: "Joe",
                    age: 20,
                },
                {
                    name: "Jhon",
                    age: 23,
                },
                {
                    name: "Joe",
                    age: 30,
                },
                {
                    name: "Jhon",
                    age: 50,
                },
            ];
            const collection = new ListCollection(persons);
            const item = collection.firstOrFail({
                filter: (person) => person.name === "Joe",
            });
            expect(item).toEqual(persons[0]);
        });
        test("Should return first item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.firstOrFail();
            expect(item).toBe(1);
        });
        test("Should throw CollectionError when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(() => {
                collection.firstOrFail({
                    filter: (item) => item === 6,
                });
            }).toThrowError(CollectionError);
        });
        test("Should throw ItemNotFoundError when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(() => {
                collection.firstOrFail({
                    filter: (item) => item === 6,
                });
            }).toThrowError(ItemNotFoundError);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const indexes: number[] = [];
            try {
                collection.firstOrFail({
                    filter: (item, index) => {
                        indexes.push(index);
                        return item === 6;
                    },
                });
            } catch {
                /* empty */
            }
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.firstOrFail()).toBe(1);
            expect(collection.firstOrFail()).toBe(1);
        });
    });
    describe("method: last", () => {
        test("Should return last item that matches the filter function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Person[] = [
                {
                    name: "Joe",
                    age: 20,
                },
                {
                    name: "Jhon",
                    age: 23,
                },
                {
                    name: "Joe",
                    age: 30,
                },
                {
                    name: "Jhon",
                    age: 50,
                },
            ];
            const collection = new ListCollection(persons);
            const item = collection.last({
                filter: (person) => person.name === "Joe",
            });
            expect(item).toEqual(persons[2]);
        });
        test("Should return last item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.last();
            expect(item).toBe(5);
        });
        test("Should return null when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.last({
                filter: (item) => item === 6,
            });
            expect(item).toBe(null);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const indexes: number[] = [];
            collection.last({
                filter: (item, index) => {
                    indexes.push(index);
                    return item === 6;
                },
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.last()).toBe(5);
            expect(collection.last()).toBe(5);
        });
    });
    describe("method: lastOr", () => {
        test("Should return last item that matches the filter function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Person[] = [
                {
                    name: "Joe",
                    age: 20,
                },
                {
                    name: "Jhon",
                    age: 23,
                },
                {
                    name: "Joe",
                    age: 30,
                },
                {
                    name: "Jhon",
                    age: 50,
                },
            ];
            const collection = new ListCollection(persons);
            const item = collection.lastOr({
                defaultValue: null,
                filter: (person) => person.name === "Joe",
            });
            expect(item).toEqual(persons[2]);
        });
        test("Should return last item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.lastOr({
                defaultValue: "a",
            });
            expect(item).toBe(5);
        });
        test("Should return default value when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.lastOr({
                defaultValue: "a",
                filter: (item) => item === 6,
            });
            expect(item).toBe("a");
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const indexes: number[] = [];
            collection.lastOr({
                defaultValue: null,
                filter: (item, index) => {
                    indexes.push(index);
                    return item === 6;
                },
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(
                collection.lastOr({
                    defaultValue: "a",
                }),
            ).toBe(5);
            expect(
                collection.lastOr({
                    defaultValue: "a",
                }),
            ).toBe(5);
        });
    });
    describe("method: lastOrFail", () => {
        test("Should return last item that matches the filter function", () => {
            type Person = {
                name: string;
                age: number;
            };
            const persons: Person[] = [
                {
                    name: "Joe",
                    age: 20,
                },
                {
                    name: "Jhon",
                    age: 23,
                },
                {
                    name: "Joe",
                    age: 30,
                },
                {
                    name: "Jhon",
                    age: 50,
                },
            ];
            const collection = new ListCollection(persons);
            const item = collection.lastOrFail({
                filter: (person) => person.name === "Joe",
            });
            expect(item).toEqual(persons[2]);
        });
        test("Should return last item when found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const item = collection.lastOrFail();
            expect(item).toBe(5);
        });
        test("Should throw CollectionError when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(() => {
                collection.lastOrFail({
                    filter: (item) => item === 6,
                });
            }).toThrowError(CollectionError);
        });
        test("Should throw ItemNotFoundError when item not found", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(() => {
                collection.lastOrFail({
                    filter: (item) => item === 6,
                });
            }).toThrowError(ItemNotFoundError);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            const indexes: number[] = [];
            try {
                collection.lastOrFail({
                    filter: (item, index) => {
                        indexes.push(index);
                        return item === 6;
                    },
                });
            } catch {
                /* empty */
            }
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([1, 2, 3, 4, 5]);
            expect(collection.lastOrFail()).toBe(5);
            expect(collection.lastOrFail()).toBe(5);
        });
    });
    describe("method: before", () => {
        test(`Should return "a" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.before((item) => item === "b");
            expect(item).toBe("a");
        });
        test(`Should return "b" when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.before((item) => item === "c");
            expect(item).toBe("b");
        });
        test(`Should return null when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.before((item) => item === "a");
            expect(item).toBe(null);
        });
        test(`Should return null when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.before((item) => item === "d");
            expect(item).toBe(null);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            collection.before((item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.before((item) => item === "c")).toBe("b");
            expect(collection.before((item) => item === "c")).toBe("b");
        });
    });
    describe("method: beforeOr", () => {
        test(`Should return "a" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.beforeOr(-1, (item) => item === "b");
            expect(item).toBe("a");
        });
        test(`Should return "b" when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.beforeOr(-1, (item) => item === "c");
            expect(item).toBe("b");
        });
        test(`Should return default value when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.beforeOr(-1, (item) => item === "a");
            expect(item).toBe(-1);
        });
        test(`Should return default value when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.beforeOr(-1, (item) => item === "d");
            expect(item).toBe(-1);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            collection.beforeOr(null, (item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            collection.beforeOr(null, (item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.beforeOr(-1, (item) => item === "c")).toBe("b");
            expect(collection.beforeOr(-1, (item) => item === "c")).toBe("b");
        });
    });
    describe("method: beforeOrFail", () => {
        test(`Should return "a" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.beforeOrFail((item) => item === "b");
            expect(item).toBe("a");
        });
        test(`Should return "b" when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.beforeOrFail((item) => item === "c");
            expect(item).toBe("b");
        });
        test(`Should throw CollectionError when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(() => {
                collection.beforeOrFail((item) => item === "a");
            }).toThrowError(CollectionError);
        });
        test(`Should throw ItemNotFoundError when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(() => {
                collection.beforeOrFail((item) => item === "d");
            }).toThrowError(ItemNotFoundError);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            try {
                collection.beforeOrFail((item, index) => {
                    indexes.push(index);
                    return item === "c";
                });
            } catch {
                /* empty */
            }
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.beforeOrFail((item) => item === "c")).toBe("b");
            expect(collection.beforeOrFail((item) => item === "c")).toBe("b");
        });
    });
    describe("method: after", () => {
        test(`Should return "c" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.after((item) => item === "b");
            expect(item).toBe("c");
        });
        test(`Should return "b" when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.after((item) => item === "a");
            expect(item).toBe("b");
        });
        test(`Should return null when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.after((item) => item === "c");
            expect(item).toBe(null);
        });
        test(`Should return null when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.after((item) => item === "d");
            expect(item).toBe(null);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            collection.after((item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.after((item) => item === "a")).toBe("b");
            expect(collection.after((item) => item === "a")).toBe("b");
        });
    });
    describe("method: afterOr", () => {
        test(`Should return "c" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.afterOr(-1, (item) => item === "b");
            expect(item).toBe("c");
        });
        test(`Should return "b" when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.afterOr(-1, (item) => item === "a");
            expect(item).toBe("b");
        });
        test(`Should return default value when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.afterOr(-1, (item) => item === "c");
            expect(item).toBe(-1);
        });
        test(`Should return default value when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.afterOr(-1, (item) => item === "d");
            expect(item).toBe(-1);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            collection.afterOr(null, (item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.afterOr(-1, (item) => item === "a")).toBe("b");
            expect(collection.afterOr(-1, (item) => item === "a")).toBe("b");
        });
    });
    describe("method: afterOrFail", () => {
        test(`Should return "c" when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.afterOrFail((item) => item === "b");
            expect(item).toBe("c");
        });
        test(`Should return "b" when searching for string "a" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const item = collection.afterOrFail((item) => item === "a");
            expect(item).toBe("b");
        });
        test(`Should throw CollectionError when searching for string "c" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(() => {
                collection.afterOrFail((item) => item === "c");
            }).toThrowError(CollectionError);
        });
        test(`Should throw ItemNotFoundError when searching for string "d" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(() => {
                collection.afterOrFail((item) => item === "d");
            }).toThrowError(ItemNotFoundError);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            const indexes: number[] = [];
            try {
                collection.afterOrFail((item, index) => {
                    indexes.push(index);
                    return item === "c";
                });
            } catch {
                /* empty */
            }
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.afterOrFail((item) => item === "a")).toBe("b");
            expect(collection.afterOrFail((item) => item === "a")).toBe("b");
        });
    });
    describe("method: sole", () => {
        test("Should throw ItemNotFoundError when item does not exist", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(() => {
                collection.sole((item) => item === "f");
            }).toThrowError(ItemNotFoundError);
        });
        test("Should throw MultipleItemsFoundError when multiple item of same sort does exist", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(() => {
                collection.sole((item) => item === "a");
            }).toThrowError(MultipleItemsFoundError);
        });
        test("Should return item when only one item of the same sort exist", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(collection.sole((item) => item === "c")).toBe("c");
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            const indexes: number[] = [];
            collection.sole((item, index) => {
                indexes.push(index);
                return item === "c";
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            expect(collection.sole((item) => item === "c")).toBe("c");
            expect(collection.sole((item) => item === "c")).toBe("c");
        });
    });
    describe("method: nth", () => {
        test("Should filter the 4:th items", () => {
            const collection = new ListCollection([
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
            ]);
            const newCollection = collection.nth(4);
            expect(newCollection.toArray()).toEqual(["a", "e"]);
        });
    });
    describe("method: count", () => {
        test(`Should return number 0 when filtering all string "a" of ["b", "b"]`, () => {
            const collection = new ListCollection(["b", "b"]);
            expect(collection.count((item) => item === "a")).toBe(0);
        });
        test(`Should return number 3 when filtering all string "a" of ["a", "b", "a", "b", "a"]`, () => {
            const collection = new ListCollection(["a", "b", "a", "b", "a"]);
            expect(collection.count((item) => item === "a")).toBe(3);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection(["a", "a", "b", "c", "b"]);
            const indexes: number[] = [];
            collection.count((_item, index) => {
                indexes.push(index);
                return true;
            });
            expect(indexes).toEqual([0, 1, 2, 3, 4]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "a", "b", "a"]);
            expect(collection.count((item) => item === "a")).toBe(3);
            expect(collection.count((item) => item === "a")).toBe(3);
        });
    });
    describe("method: size", () => {
        test("Should return 0 when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.size()).toBe(0);
        });
        test("Should return number larger than 0 when empty", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.size()).toBeGreaterThan(0);
        });
        test("Should return 3 when contains 3 items", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.size()).toBe(3);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.size()).toBe(3);
            expect(collection.size()).toBe(3);
        });
    });
    describe("method: empty", () => {
        test("Should return true when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.empty()).toBe(true);
        });
        test("Should return false when not empty", () => {
            const collection = new ListCollection([""]);
            expect(collection.empty()).toBe(false);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([]);
            expect(collection.empty()).toBe(true);
            expect(collection.empty()).toBe(true);
        });
    });
    describe("method: notEmpty", () => {
        test("Should return true when not empty", () => {
            const collection = new ListCollection([""]);
            expect(collection.notEmpty()).toBe(true);
        });
        test("Should return false when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.notEmpty()).toBe(false);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection([""]);
            expect(collection.notEmpty()).toBe(true);
            expect(collection.notEmpty()).toBe(true);
        });
    });
    describe("method: search", () => {
        test("Should return -1 when searching for value that does not exist in collection", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.search((item) => item === "d")).toBe(-1);
        });
        test(`Should return 1 when searching for string "b" of ["a", "b", "c"]`, () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.search((item) => item === "b")).toBe(1);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.search((item) => item === "b")).toBe(1);
            expect(collection.search((item) => item === "b")).toBe(1);
        });
    });
    describe("method: forEach", () => {
        test("Should iterate all items", () => {
            const arr1 = [1, 2, 3];
            const collection = new ListCollection(arr1);
            const arr2: number[] = [];
            collection.forEach((item) => arr2.push(item));
            expect(arr2).toEqual(arr1);
        });
        test("Should input correct indexes to filter function", () => {
            const collection = new ListCollection([1, 2, 3]);
            const indexes: number[] = [];
            collection.forEach((_item, index) => {
                indexes.push(index);
            });
            expect(indexes).toEqual([0, 1, 2]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const arr1 = [1, 2, 3];
            const collection = new ListCollection(arr1);
            const arr2: number[] = [];
            collection.forEach((item) => arr2.push(item));
            expect(arr2).toEqual(arr1);
            expect(arr2).toEqual(arr1);
        });
    });
    describe("method: toArray", () => {
        test("Should return array with 0 items when empty", () => {
            const collection = new ListCollection([]);
            expect(collection.toArray()).toEqual([]);
        });
        test("Should return array with items when that match collection items", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.toArray()).toEqual(["a", "b", "c"]);
        });
        test("Should return the same value when called more than 1 times", () => {
            const collection = new ListCollection(["a", "b", "c"]);
            expect(collection.toArray()).toEqual(["a", "b", "c"]);
            expect(collection.toArray()).toEqual(["a", "b", "c"]);
        });
    });
});
