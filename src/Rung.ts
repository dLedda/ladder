import Ref from "./Ref";
import { ISubscription } from "./Publisher";

export type RungOptions = {};

type IRenderAttributes<T extends keyof HTMLElementTagNameMap> = Partial<{
    [K in keyof HTMLElementTagNameMap[T]]: HTMLElementTagNameMap[T][K] | Ref<HTMLElementTagNameMap[T][K]>
}> & {
    classes?: string[],
    saveTo?: Ref<HTMLElementTagNameMap[T] | null>,
};

export default abstract class Rung {
    protected el: HTMLElement | null = null;

    constructor(options: RungOptions) {}

    render(): HTMLElement {
        if (!this.el) {
            this.el = this.build();
        }
        return this.el;
    }

    protected getEl(): HTMLElement {
        if (!this.el) {
            return this.render();
        } else {
            return this.el;
        }
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

export function frag(subs?: Rung[]): DocumentFragment {
    const frag = document.createDocumentFragment();
    if (subs) {
        attachSubs(frag, subs);
    }
    return frag;
}

export function q(text: string): Text {
    return document.createTextNode(text);
}

export function h<T extends keyof HTMLElementTagNameMap>(type: T, attributes?: IRenderAttributes<T>, subNodes?: (Rung | Node | Ref)[]): HTMLElementTagNameMap[T] {
    const element = document.createElement(type);
    if (attributes) {
        if (attributes.classes) {
            element.classList.add(...attributes.classes);
        }
        if (attributes.saveTo) {
            attributes.saveTo.val = element;
        }
        applyAttributes(element, attributes);
    }
    if (subNodes) {
        attachSubs(element, subNodes);
    }
    return element;
}

function nodeRefWatcher<T>(newVal: T extends Ref<infer U> ? U : never, textNode: Text, sub: ISubscription): void {
    if (!textNode.parentNode) {
        sub.unbind();
        textNode.remove();
    } else {
        textNode.replaceWith(newVal?.toString() ?? "<dead ref>");
    }
}

function attachSubs(node: Element | DocumentFragment, subNodes: (Rung | Node | Ref)[]): void {
    for (let i = 0; i < subNodes.length; i++) {
        const subNode = subNodes[i];
        if (subNode instanceof Rung) {
            node.append(subNode.render());
        } else if (subNode instanceof Ref) {
            const textNode = q(subNode.val.toString());
            const sub = subNode.watch((newVal) => nodeRefWatcher<Ref>(newVal, textNode, sub));
            node.append(textNode);
        } else {
            node.append(subNode);
        }
    }
}

function applyAttributes<T extends keyof HTMLElementTagNameMap>(element: HTMLElement, attributes: IRenderAttributes<T>): void {
    for (const key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
            const attribute = (attributes as Record<string, unknown>)[key];
            if (attribute) {
                if (attribute instanceof Ref) {
                    const attributeAsRef = attribute as Ref;
                    const elementWithAttributeKey = element as unknown as Record<string, typeof attributeAsRef.val>;
                    elementWithAttributeKey[key] = attributeAsRef.val;
                    attribute.watch((newVal) => elementWithAttributeKey[key] = newVal);
                } else {
                    (element as unknown as ({ [key: string]: typeof attribute }))[key] = attribute;
                }
            }
        }
    }
}
