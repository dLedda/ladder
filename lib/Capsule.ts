import { ISubscription } from "./Publisher";

class CapsuleSubscription implements ISubscription {
    private unbindCallback?: () => void;

    constructor(unbindCallback: () => void) {
        this.unbindCallback = unbindCallback;
    }

    unbind(): void {
        this.unbindCallback?.();
    }
}

interface Stringable {
    toString(): string;
}
type Capsable = Stringable | string | null;
export type MaybeCapsule<T> = T | Capsule<T>;

export default class Capsule<T extends Capsable = Capsable> {
    private watchers: Array<(newVal: T) => void> | null = null;
    private afterWatchers: Array<(newVal: T) => void> | null = null;
    private value: T;
    private asString?: string;
    private isString: boolean;

    private constructor(val: T) {
        this.value = val;
        this.isString = typeof val === "string";
    }

    static new<T extends Capsable>(val: MaybeCapsule<T>): Capsule<T> {
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
        if (!this.asString) {
            if (this.isString) {
                return this.val as unknown as string;
            } else {
                this.asString = this.val?.toString() ?? "null";
            }
        }
        return this.asString;
    }
}

