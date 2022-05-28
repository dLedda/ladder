export type LEvent = string;
export interface ISubscriber<T extends LEvent> {
    notify(publisher: unknown, event: T): void;
}