import { h, frag, bootstrap, Rung, Capsule } from "../index";

class AppJSX extends Rung {
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

    build() {
        return <>
            <h1>Ladder</h1>
            <div className={"counter-widget"}>
                <button onclick={() => this.counter.val--}>-</button>
                <span className={"counter"}>{this.counter}</span>
                <button onclick={() => this.counter.val++}>+</button>
            </div>
            <div saveTo={this.rungs}/>
        </>;
    }
}

class AppHypertext extends Rung {
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

    build() {
        return frag(null,
            h("h1", {}, "Ladder"),
            h("div", {className: "counter-widget"},
                h("button", {onclick: () => this.counter.val--}, "-"),
                h("span", {className: "counter"}, this.counter),
                h("button", {onclick: () => this.counter.val++}, "+"),
            ),
            h("div", {saveTo: this.rungs}),
        );
    }
}

const appJsx = new AppJSX();
const appH = new AppHypertext();
bootstrap(appJsx, "app");
