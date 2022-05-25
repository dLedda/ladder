import Capsule from "./Capsule";
import {ISubscription} from "./Publisher";
import Rung from "./Rung";

type IRenderAttributes<T extends keyof HTMLElementTagNameMap> = Partial<{
    [K in keyof HTMLElementTagNameMap[T]]: HTMLElementTagNameMap[T][K] | Capsule<HTMLElementTagNameMap[T][K]>
}> & {
    classes?: string[],
    saveTo?: Capsule<HTMLElementTagNameMap[T] | null>,
};

type IdSelector = `#${ string }`;

export function bootstrap(app: Rung, id: IdSelector) {
    const rootNode = document.querySelector(id);
    if (!rootNode) {
        throw new Error(`No node was found with the id ${id} to attach to`);
    } else {
        rootNode.appendChild(app.render());
    }
}

export function frag(subs?: Node[]): DocumentFragment {
    const frag = document.createDocumentFragment();
    if (subs) {
        attachSubs(frag, subs);
    }
    return frag;
}

export function q(text: string): Text {
    return document.createTextNode(text);
}

export function h<T extends keyof HTMLElementTagNameMap>(type: T, attributes?: IRenderAttributes<T>, subNodes?: (Rung | Node | Capsule)[]): HTMLElementTagNameMap[T] {
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

function nodeCapsuleWatcher<T>(newVal: T extends Capsule<infer U> ? U : never, textNode: Text, sub: ISubscription): void {
    if (!textNode.parentNode) {
        sub.unbind();
        textNode.remove();
    } else {
        textNode.replaceWith(newVal?.toString() ?? q("[dead ref]"));
    }
}

function attachSubs(node: Element | DocumentFragment, subNodes: (Rung | Node | Capsule)[]): void {
    for (let i = 0; i < subNodes.length; i++) {
        const subNode = subNodes[i];
        if (subNode instanceof Rung) {
            node.append(subNode.render());
        } else if (subNode instanceof Capsule) {
            const textNode = q(subNode.toString());
            const sub = subNode.watch((newVal) => nodeCapsuleWatcher<Capsule>(newVal, textNode, sub));
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
                if (attribute instanceof Capsule) {
                    const attributeAsCapsule = attribute as Capsule;
                    const elementWithAttributeKey = element as unknown as Record<string, typeof attributeAsCapsule.val>;
                    elementWithAttributeKey[key] = attributeAsCapsule.val;
                    attribute.watch((newVal) => elementWithAttributeKey[key] = newVal);
                } else {
                    (element as unknown as Record<string, typeof attribute>)[key] = attribute;
                }
            }
        }
    }
}