import {isCapsule, ICapsule} from "./Capsule";
import {ISubscription} from "./Publisher";
import Rung, {FunctionalRung} from "./Rung";

export type IRenderAttributes<T extends keyof HTMLElementTagNameMap> = Partial<{
    [K in keyof HTMLElementTagNameMap[T]]: HTMLElementTagNameMap[T][K] | ICapsule<HTMLElementTagNameMap[T][K]>
}> & {
    classes?: string[],
    saveTo?: ICapsule<HTMLElementTagNameMap[T] | null>,
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

type InstantiationType = FunctionalRung<any, any> | keyof HTMLElementTagNameMap;

type Props<T> =
    T extends FunctionalRung<infer Attributes, infer Return>
        ? Attributes
        : T extends keyof HTMLElementTagNameMap
            ? IRenderAttributes<T>
            : never;

export type SubNode = Rung | Node | ICapsule;

export function h<T extends keyof HTMLElementTagNameMap>(type: T, attributes?: Props<T>, ...subNodes: SubNode[]): HTMLElementTagNameMap[T];
export function h<T extends FunctionalRung<any, any>, U extends Props<T>, V extends ReturnType<T>>(type: T, attributes?: U, ...subNodes: SubNode[]): V;
export function h<T extends InstantiationType>(type: T, attributes?: Props<T> | null, ...subNodes: SubNode[]) {
    if (typeof type === "function") {
        return type(attributes, subNodes);
    } else {
        return createStandardElement(type, attributes ?? {}, subNodes);
    }
}

function createStandardElement<T extends keyof HTMLElementTagNameMap>(
    type: T,
    attributes: IRenderAttributes<T> | null,
    subNodes: SubNode[]
): HTMLElementTagNameMap[T] {
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
    attachSubs(element, subNodes);
    return element;
}

function nodeCapsuleWatcher<T>(newVal: T extends ICapsule<infer U> ? U : never, textNode: Text, sub: ISubscription): void {
    if (!textNode.parentNode) {
        sub.unbind();
        textNode.remove();
    } else {
        textNode.replaceWith(newVal?.toString() ?? q("[dead ref]"));
    }
}

function attachSubs(node: Element | DocumentFragment, subNodes: SubNode[]): void {
    for (let i = 0; i < subNodes.length; i++) {
        const subNode = subNodes[i];
        if (subNode instanceof Rung) {
            node.append(subNode.render());
        } else if (isCapsule(subNode)) {
            const textNode = q(subNode.toString());
            const sub = subNode.watch((newVal) => nodeCapsuleWatcher<ICapsule>(newVal, textNode, sub));
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
                if (isCapsule(attribute)) {
                    const attributeAsCapsule = attribute as ICapsule;
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