import { h, q, frag, bootstrap, Rung, Capsule } from "./index";
import {SubNode} from "./lib/helpers";

const MyCoolDiv = (props: { isRed: boolean }, subNodes?: SubNode[]) => h("div", { classes: props.isRed ? ["red"] : [] }, ...subNodes ?? []);

class App extends Rung {
    private counter = Capsule.new<number>(0);
    private rungs = Capsule.new<HTMLDivElement | null>(null);

    constructor() {
        super({});
        this.counter.watch((count) => {
            if (this.rungs.val) {
                this.rungs.val.replaceChildren(
                    ...new Array(count).fill(null).map((_, i) => {
                        return <div className={'rung'}/>;
                    })
                );
            }
        });
    }

    build() {
        return <>
            <style>{`
.rung {
    width: 30px;
    height: 30px;
    border: solid black;
    border-width: 0 2px 2px 2px;
}
.rung:last-of-type {
    border-width: 0 2px 0 2px;
}
.rung:first-of-type {
    border-width: 0 2px 2px 2px;
}
`}</style>
            <h1>Ladder</h1>
            <button onclick={() => this.counter.val--}>-</button>
            <span>{this.counter}</span>
            <button onclick={() => this.counter.val++}>+</button>
            <div saveTo={this.rungs}/>
        </>;
    }
}

const app = new App();
bootstrap(app, "app");
