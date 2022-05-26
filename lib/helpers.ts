import {isCapsule, ICapsule} from "./Capsule";
import {ISubscription} from "./Publisher";
import Rung, {FunctionalRung} from "./Rung";

type CommonRenderAttributes<T> = {
    classes?: string[],
    saveTo?: ICapsule<T | null>,
};
export type IRenderAttributes<T extends keyof HTMLElementTagNameMap | DocumentFragment> =
    T extends DocumentFragment
        ? Partial<{ [K in keyof DocumentFragment]: DocumentFragment[K] | ICapsule<DocumentFragment[K]> }> & CommonRenderAttributes<DocumentFragment>
        : T extends keyof HTMLElementTagNameMap
            ? Partial<{
                    [K in keyof HTMLElementTagNameMap[T]]: HTMLElementTagNameMap[T][K] | ICapsule<HTMLElementTagNameMap[T][K]>
                }> & CommonRenderAttributes<HTMLElementTagNameMap[T]>
            : never;

export function bootstrap(app: Rung, id: string) {
    const rootNode = document.getElementById(id);
    if (!rootNode) {
        throw new Error(`No node was found with the id ${id} to attach to`);
    } else {
        rootNode.appendChild(app.render());
    }
}

export function frag(attributes: IRenderAttributes<DocumentFragment> | null, subs?: SubNode[]): DocumentFragment {
    const frag = document.createDocumentFragment();
    if (attributes) {
        applyAttributes(frag, attributes);
    }
    if (subs) {
        attachSubs(frag, subs);
    }
    return frag;
}

export function q(text: string): Text {
    return document.createTextNode(text);
}

type InstantiationType = FunctionalRung<any, any> | keyof HTMLElementTagNameMap | Rung;

type Props<T> =
    T extends FunctionalRung<infer Attributes, infer Return>
        ? Attributes & CommonRenderAttributes<Return>
        : T extends keyof HTMLElementTagNameMap
            ? IRenderAttributes<T>
            : T extends Rung
                ? CommonRenderAttributes<T>
                : never;

export type SubNode = Rung | Node | ICapsule;

export function h<T extends keyof HTMLElementTagNameMap>(type: T, attributes?: Props<T>, ...subNodes: SubNode[]): HTMLElementTagNameMap[T];
export function h<T extends FunctionalRung<any, any>, U extends Props<T>>(type: T, attributes?: U, ...subNodes: SubNode[]): ReturnType<T>;
export function h<T extends Rung>(type: T, attributes: CommonRenderAttributes<T>): ReturnType<T["render"]>;
export function h<T extends InstantiationType>(type: T, attributes?: Props<T> | null, ...subNodes: SubNode[]) {
    if (typeof type === "function") {
        return createFunctionalRungElement(type, attributes, subNodes);
    } else if (type instanceof Rung) {
        const rendered = type.render();
        if (attributes?.classes && rendered instanceof HTMLElement) {
            rendered.classList.add(...attributes.classes);
        }
        if (attributes?.saveTo) {
            attributes.saveTo.val = rendered;
        }
        return rendered;
    } else {
        return createStandardElement(type, attributes ?? {}, subNodes);
    }
}

function createFunctionalRungElement<T extends FunctionalRung<any, any>, U extends Props<T>>(
    type: T,
    attributes: U,
    subNodes: SubNode[]
): ReturnType<T> {
    for (let i = 0; i < subNodes.length; i++) {
        const subNode = subNodes[i];
        if (isCapsule(subNode)) {
            const textNode = q(subNode.toString());
            const sub = subNode.watch((newVal) => nodeCapsuleWatcher<ICapsule>(newVal, textNode, sub));
            subNodes[i] = textNode;
        }
    }
    const rendered = subNodes.length > 0 ? type(attributes, subNodes) : type(attributes);
    if (attributes?.classes && rendered instanceof HTMLElement) {
        rendered.classList.add(...attributes.classes);
    }
    if (attributes?.saveTo) {
        attributes.saveTo.val = rendered;
    }
    return rendered;
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
        textNode.textContent = newVal?.toString() ?? "[dead ref]";
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

function applyAttributes<T extends keyof HTMLElementTagNameMap>(element: HTMLElementTagNameMap[T], attributes: IRenderAttributes<T>): void;
function applyAttributes(element: DocumentFragment, attributes: IRenderAttributes<DocumentFragment>): void;
function applyAttributes(element: HTMLElementTagNameMap[keyof HTMLElementTagNameMap] | DocumentFragment, attributes: IRenderAttributes<any>): void {
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