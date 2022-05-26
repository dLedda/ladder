import { IRenderAttributes } from './lib/helpers';

declare namespace JSX {
    type Element = Node;
    export interface AttributeCollection {
        [name: string]: string | boolean | (() => any);
        className: string;
    }
    type RenderAttributes = {
        [TagName in keyof HTMLElementTagNameMap]: IRenderAttributes<TagName>;
    };
    export interface IntrinsicElements extends RenderAttributes {}
}