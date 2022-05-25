export type RungOptions = {};

export default abstract class Rung {
    protected el: HTMLElement | null = null;

    protected constructor(options: RungOptions) {}

    render(): HTMLElement {
        if (!this.el) {
            this.el = this.build();
        }
        return this.el;
    }

    protected getEl(): HTMLElement {
        return this.render();
    }

    redraw(): void {
        const oldNode = this.el;
        if (!oldNode || !this.el) {
            return;
        }
        const parent = this.el.parentElement;
        if (parent) {
            this.el = this.build();
            parent.replaceChild(this.el, oldNode);
        } else {
            this.render();
        }
    }

    protected abstract build(): HTMLElement;
}
