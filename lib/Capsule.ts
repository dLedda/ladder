import { ISubscription } from "./Publisher";

export interface Stringable {
    toString(): string;
}

export type Captable = Stringable | string | null;

export interface ICapsule<T extends Captable = Captable> {
    watch(watcher: (newVal: T) => void, after?: boolean): ISubscription;
    toString(): string;
    val: T;
}

export function isCapsule(maybeCapsule: any): maybeCapsule is ICapsule {
    return typeof maybeCapsule.val !== "undefined"
        && typeof maybeCapsule.watch === "function"
        && typeof maybeCapsule.toString === "function";
}

class CapsuleSubscription implements ISubscription {
    private unbindCallback?: () => void;

    constructor(unbindCallback: () => void) {
        this.unbindCallback = unbindCallback;
    }

    unbind(): void {
        this.unbindCallback?.();
    }
}

export default class Capsule<T extends Captable = Captable> implements ICapsule {
    private watchers: Array<(newVal: T) => void> | null = null;
    private afterWatchers: Array<(newVal: T) => void> | null = null;
    private value: T;
    private asString?: string;
    private isString: boolean;

    private constructor(val: T) {
        this.value = val;
        this.isString = typeof val === "string";
    }

    static new<T extends Captable>(val: T | Capsule<T>): Capsule<T> {
        if (val instanceof Capsule) {
            return val;
        } else {
            return new Capsule<T>(val);
        }
    }

    watch(watcher: (newVal: T) => void, after?: boolean): ISubscription {
        if (after) {
            if (this.afterWatchers === null) {
                this.afterWatchers = [];
            }
            this.afterWatchers.push(watcher);
        } else {
            if (this.watchers === null) {
                this.watchers = [];
            }
            this.watchers.push(watcher);
        }
        return new CapsuleSubscription(() => this.unbind(watcher, !!after));
    }

    private unbind(watcher: (newVal: T) => void, after: boolean): void {
        if (after) {
            if (!this.afterWatchers) {
                return;
            }
            const index = this.afterWatchers.indexOf(watcher);
            if (index !== -1) {
                this.afterWatchers.splice(index, 1);
            }
        } else {
            if (!this.watchers) {
                return;
            }
            const index = this.watchers.indexOf(watcher);
            if (index !== -1) {
                this.watchers.splice(index, 1);
            }
        }
    }

    get val(): T {
        return this.value;
    }

    set val(val: T) {
        this.watchers?.forEach(watcher => watcher(val));
        this.value = val;
        this.afterWatchers?.forEach(watcher => watcher(val));
    }

    toString(): string {
        if (this.isString) {
            return this.value as unknown as string;
        }
        if (!this.asString) {
            this.asString = this.val?.toString() ?? "null";
        }
        return this.asString;
    }
}

