import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap extension for <figure> element.
 * Preserves figure structure, passes through class + style attributes.
 */
export const Figure = Node.create({
    name: 'figure',

    group: 'block',

    content: 'block+',

    defining: true,

    addAttributes() {
        return {
            class: {
                default: null,
                parseHTML: (el) => el.getAttribute('class'),
            },
            style: {
                default: null,
                parseHTML: (el) => el.getAttribute('style'),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'figure' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['figure', mergeAttributes(HTMLAttributes), 0];
    },
});

/**
 * Custom TipTap extension for <figcaption> element.
 * Flexible — preserves inline content + style, supports TextAlign.
 * User can freely toggle italic, change alignment via toolbar.
 */
export const FigCaption = Node.create({
    name: 'figcaption',

    group: 'block',

    content: 'inline*',

    defining: true,

    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: (el) => el.getAttribute('style'),
            },
            textAlign: {
                default: null,
                parseHTML: (el) => el.style.textAlign || null,
                renderHTML: (attrs) => {
                    if (!attrs.textAlign) return {};
                    return { style: `text-align: ${attrs.textAlign}` };
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'figcaption' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['figcaption', mergeAttributes(HTMLAttributes), 0];
    },
});
