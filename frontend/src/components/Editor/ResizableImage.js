/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageView } from './ResizableImageView.jsx';

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute('width') || el.style.width;
          if (!w) return null;
          return /^\d+$/.test(w) ? `${w}px` : w;
        },
        renderHTML: (attrs) => (attrs.width ? { width: parseInt(attrs.width), style: `width: ${attrs.width}` } : {}),
      },
    };
  },

  // tiptap-markdown picks up storage.markdown for custom serialization
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const { src, alt, title, width } = node.attrs;
          if (width) {
            const w = parseInt(width);
            const escapedSrc = (src || '').replace(/"/g, '&quot;');
            const escapedAlt = (alt || '').replace(/"/g, '&quot;');
            state.write(`<img src="${escapedSrc}" alt="${escapedAlt}" width="${w}" />`);
          } else {
            state.write(`![${state.esc(alt || '')}](${state.esc(src || '')}${title ? ` ${state.quote(title)}` : ''})`);
          }
        },
        parse: {
          // handled by markdown-it
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
