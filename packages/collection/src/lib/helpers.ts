class TimesIterable<TValue> implements Iterable<TValue> {
    constructor(
        private amount: number,
        private callback: (number: number) => TValue,
    ) {}

    *[Symbol.iterator](): Iterator<TValue> {
        for (let i = 1; i <= this.amount; i++) {
            yield this.callback(i);
        }
    }
}
export function times<TValue>(
    amount: number,
    callback: (number: number) => TValue,
): Iterable<TValue> {
    return new TimesIterable(amount, callback);
}

class RangeIterable implements Iterable<number> {
    constructor(
        private from: number,
        private to: number,
    ) {}

    *[Symbol.iterator](): Iterator<number> {
        for (let i = this.from; i <= this.to; i++) {
            yield i;
        }
    }
}
export function range(from: number, to: number): Iterable<number> {
    return new RangeIterable(from, to);
}

class AsyncTimesIterable<TValue> implements AsyncIterable<TValue> {
    constructor(
        private amount: number,
        private callback: (number: number) => TValue,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<TValue> {
        for (let i = 1; i <= this.amount; i++) {
            yield this.callback(i);
        }
    }
}
export function asyncTimes<TValue>(
    amount: number,
    callback: (number: number) => TValue,
): AsyncIterable<TValue> {
    return new AsyncTimesIterable(amount, callback);
}

export function isIterable<TItem>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
): value is Iterable<TItem> {
    return typeof value[Symbol.iterator] === "function";
}
export function isAsyncIterable<TItem>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
): value is AsyncIterable<TItem> {
    return typeof value[Symbol.asyncIterator] === "function";
}
