import { IRenderAttributes } from './helpers';
import Rung from "./Rung";
import {ICapsule} from "./Capsule";

type RenderAttributesMap = {
    [TagName in keyof HTMLElementTagNameMap]: IRenderAttributes<TagName>;
};

declare global {
    namespace JSX {
        interface Element extends Node {}
        interface ElementClass extends Rung {}
        interface AttributeCollection {
            [name: string]: string | boolean | (() => any);
            className: string;
        }
        interface IntrinsicAttributes {
            saveTo?: ICapsule<Node | null>;
            classes?: string[];
        }
        interface IntrinsicClassAttributes {
            saveTo?: ICapsule<Node | null>;
            classes?: string[];
        }
        interface IntrinsicElements extends RenderAttributesMap {}
    }
}
