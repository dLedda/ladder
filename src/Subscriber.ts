export type LEvent = string;
export default interface ISubscriber<T extends LEvent> {
    notify(publisher: unknown, event: T): void;
}