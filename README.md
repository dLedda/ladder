# Ladder

Most libraries give you a whole framework. This is just a ladder.

## What's in the box?

Ladder is a tiny* TypeScript-only library to quickly start using "hyperscript" style functions and optionally JSX in your code.

Ladder includes:

- An (almost) bare-bones `h` function, JSX compatible.
- Optional `Rung` hierarchical UI-node primitive.
- Optional `Capsule` reactive value primitive.
- Optional basic implementation of the pub/sub model: `Publisher`s and `Subscriber`s 

`Capsules` can be saved to directly from the `h`-function to insert the resultant node into the capsule.
They can also be used as the value of a prop to automatically watch for updates and update the HTML node they were used on accordingly.
 
Everything else is up to you. You have full control over how the app works. 

Here is an example app:

```tsx
import { Rung, Capsule, bootstrap, h, frag } from 'ladder';

class App extends Rung {
    private counter = Capsule.new<number>(0);
    private rungs = Capsule.new<HTMLDivElement | null>(null);

    constructor() {
        super({});
        this.counter.watch((count) => this.onCounterUpdate(count));
    }

    private onCounterUpdate(count: number) {
        const rungs = Array<Node>(count);
        for (let i = 0; i < rungs.length; i++) {
            rungs[i] = <div className={'rung'}/>;
        }
        this.rungs.val?.replaceChildren(...rungs);
    }

    // using JSX
    build() { 
        return <>
            <h1>Ladder</h1>
            <button onclick={() => this.counter.val--}>-</button>
            <span>{this.counter}</span>
            <button onclick={() => this.counter.val++}>+</button>
            <div saveTo={this.rungs}/>
        </>;
    }

    // using pure ts
    build() {
        return frag(null, 
            h("h1", {}, "Ladder"),
            h("button", {onclick: () => this.counter.val--}, "-"),
            h("span", {}, this.counter),
            h("button", {onclick: () => this.counter.val++}, "+"),
            h("div", {saveTo: this.rungs}),
        ); 
    }
}

bootstrap(new App(), "app");
```

The bootstrap function injects the results of `build` into the HTML node with the `app` id.

### Rungs

A Rung is any class derived from the internal `Rung` abstract class.
A Rung must implement the `build` method, returning an instance of the HTML `Node` primitive (e.g. using the `h` function included). Once a Rung is 'built', it is done. All subsequent `render` calls to the Rung will return the prebuilt DOM tree. It is then up to you manipulate the Rung's internal DOM-tree yourself, should anything need to change. 

Rungs can be included directly as a child in the JSX and the `render` function is called automatically. Should you need to rerun the `build` function, you can call `redraw` internally and the resultant node will be inserted at its predecessor's position in the DOM directly.

This `build` function will insert the result of the `render` call of the `this.coolRung` instance directly.
```tsx
class MyCoolRung extends Rung {
    // ... great code ...
}

class SuperRung extends Rung {
    private coolRung = new MyCoolRung();

    constructor() {
        super({});
    }

    build() {
        return <div>Check out this rung here: {this.coolRung}</div>;
    }
}
```

Rungs are intentionally not able to be used in JSX. JSX should only be used for `HTMLElement`s, as Rungs are not declarative, rather, they are simple objects.

### Capsules

A Capsule is a primitive used to store a single value that can be watched for changes.

It can be any object fulfilling the following interface (included in the library):

```ts
interface ICapsule<T extends Captable = Captable> {
    watch(watcher: (newVal: T) => void, after?: boolean): ISubscription;
    toString(): string;
    val: T;
}

type Captable = { toString(): string; } | string | null;

interface ISubscription {
    unbind(): void;
}
```

I.e. Capsules must encapsulate values that can either be null or be able to be cast to a `string`.

Capsules can be used in `h`/JSX as a HTML attribute, a child node, or as the value of the special `saveTo` property:

Taking the `build` method from the initial example:
```tsx
class App extends Rung {
    // ...
    build() {
        return <>
            <h1>Ladder</h1>
            <button onclick={() => this.counter.val--}>-</button>
            <span>{this.counter}</span>
            <button onclick={() => this.counter.val++}>+</button>
            <div saveTo={this.rungs}/>
        </>;
    }
    // ...
}
```

`this.counter` and `this.rungs` are both Capsules and as such the node generated as a child of the `<span>` for `this.counter` will update when the watcher callback is fired.
Similarly, the `<div>` node at the end of the fragment is saved to `this.rungs` to be used in the Rung.

### Pub/Sub

Often, littering your code with reactive primitives isn't the best idea. You might want to notify your dependants of any updates after a series of complex operations that are applied to multiple different values that are used in different places. Notifying your dependants manually is useful for this kind of use case.

Ladder includes `Publisher` and `Subscription` primitives to include in your Rungs or elsewhere in your program.

For example, suppose you have a `Track` data class that emits events:

```ts
const enum TrackEvents {
    NewTimeSig="tr-0",
    NewBarCount="tr-1",
    NewName="tr-2",
    DisplayTypeChanged="tr-3",
    Baked="tr-4",
    DeepChange="tr-5",
}

class Track implements IPublisher<TrackEvents> {
    // ...
}
```

And a Rung that listens for some of them:

```ts
type TrackSubs =
    | TrackEvents.NewName
    | TrackEvents.NewTimeSig
    | TrackEvents.NewBarCount
    | TrackEvents.DisplayTypeChanged;

class TrackView extends Rung implements ISubscriber<TrackSubs> {
    // ...
}
```

The track view can then subscribe to its track instance member using the same strings using `track.addSubscriber(this, <array-of-track-subs>)`.
To respond to fired events, TrackView implements `notify`:

```ts
class TrackView extends Rung implements ISubscriber<TrackSubs> {
    // ...
    notify(publisher: Track, event: TrackSubs): void {
        switch (event) {
        case TrackEvents.NewName:
        case TrackEvents.NewTimeSig:
        case TrackEvents.NewBarCount:
        case TrackEvents.DisplayTypeChanged:
        case TrackEvents.LoopLengthChanged:
            // respond!
            break;
        }
    }
    // ...
}
```

`addSubscriber` returns `ISubscription`, with the same interface as a Capsule. You must call `unbind` if you want to stop listening e.g. when doing cleanup tasks.

Here is a trick to write the list of subscribed events once and generate a type from it, reducing duplicate code and consistency mess:

```ts
const TrackSubs = [
    TrackEvents.NewName,
    TrackEvents.NewTimeSig,
    TrackEvents.NewBarCount,
    TrackEvents.DisplayTypeChanged,
];

type TrackSubs = typeof TrackSubs[number]; // Yes, the names can be identical!

class TrackView extends Rung implements ISubscriber<TrackSubs> {
    // ...
}
```

### Miscellaneous Helpers

There are also the two methods `q` and `frag` that wrap `document.createTextNode` and `document.createDocumentFragment` respectively to reduce bloat when using pure JavaScript.

---

That's about it. You can use as much or as little as you want, hopefully you find it useful for simple or complicated apps for which modern JS Frameworks are just too much overhead in terms of either setup, performance, or restrictivity.

*All components of Ladder are about ~2.5KiB transpiled and minified, ~1KiB gzipped.