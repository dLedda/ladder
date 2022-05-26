import {SubNode} from "./helpers";

export type RungOptions = {};

export default abstract class Rung {
    protected node: Node | null = null;

    protected constructor(options: RungOptions) {}

    render(): Node {
        if (!this.node) {
            this.node = this.build();
        }
        return this.node;
    }

    protected getEl(): Node {
        return this.render();
    }

    redraw(): void {
        const oldNode = this.node;
        if (!oldNode || !this.node) {
            return;
        }
        const parent = this.node.parentElement;
        if (parent) {
            this.node = this.build();
            parent.replaceChild(this.node, oldNode);
        } else {
            this.render();
        }
    }

    protected abstract build(): Node;
}

export type FunctionalRung<Props extends Record<string, any>, N extends HTMLElement> = (attributes: Props, subNodes?: SubNode[]) => N;
