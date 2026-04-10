import { NodeViewWrapper } from '@tiptap/react';
import { useRef, useCallback } from 'react';

export function ResizableImageView({ node, updateAttributes, selected }) {
  const { src, alt, width } = node.attrs;
  const imgRef = useRef(null);

  const onResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = imgRef.current?.offsetWidth ?? (parseInt(width) || 400);

      const onMove = (me) => {
        const newW = Math.max(50, startW + me.clientX - startX);
        updateAttributes({ width: `${newW}px` });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [updateAttributes, width],
  );

  return (
    <NodeViewWrapper as="div" className="relative my-2 inline-block max-w-full">
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        style={{ width: width || undefined, maxWidth: '100%', display: 'block' }}
        className={selected ? 'ring-2 ring-accent/60 rounded-sm' : ''}
        draggable={false}
      />
      {selected && (
        <div
          onMouseDown={onResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 bg-accent rounded-tl cursor-se-resize opacity-75 hover:opacity-100 transition-opacity"
          title="Drag to resize"
        />
      )}
    </NodeViewWrapper>
  );
}
