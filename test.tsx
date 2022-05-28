import { h, frag, bootstrap, Rung, Capsule } from "./index";

class CoolRung extends Rung {
    constructor() {
        super({});
    }

    build() {
        return <div>
            My Cool Rung
        </div>;
    }
}

class App extends Rung {
    private counter = Capsule.new<number>(0);
    private rungs = Capsule.new<HTMLDivElement | null>(null);
    private coolRung = new CoolRung();

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
            h("button", {onclick: () => this.counter.val--}, "-"),
            h("span", {}, this.counter),
            h("button", {onclick: () => this.counter.val++}, "+"),
            h("div", {saveTo: this.rungs}),
        );
    }
}

const app = new App();
bootstrap(app, "app");
