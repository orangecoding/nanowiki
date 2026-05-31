/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState } from 'react';
import { Icon } from '../Icon.jsx';
import { FileLinkPicker } from './FileLinkPicker.jsx';

function TbBtn({ onClick, active, title, children, variant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`tb-btn${active ? ' active' : ''}${variant ? ` tb-btn--${variant}` : ''}`}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    const url = prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <>
      <div className="toolbar">
        {/* Headings */}
        <div className="tb-group">
          <TbBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
            variant="h"
          >
            H1
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
            variant="h"
          >
            H2
          </TbBtn>
        </div>

        <div className="tb-sep" />

        {/* Inline formatting */}
        <div className="tb-group">
          <TbBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
            variant="b"
          >
            B
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
            variant="i"
          >
            I
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
            variant="s"
          >
            S
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >
            <Icon name="code" size={14} />
          </TbBtn>
        </div>

        <div className="tb-sep" />

        {/* Lists & quotes */}
        <div className="tb-group">
          <TbBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <Icon name="list" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <Icon name="listOrdered" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Icon name="quote" size={14} />
          </TbBtn>
        </div>

        <div className="tb-sep" />

        {/* Inserts */}
        <div className="tb-group">
          <TbBtn onClick={setLink} active={editor.isActive('link')} title="Insert link">
            <Icon name="link" size={14} />
          </TbBtn>
          <TbBtn onClick={() => setPickerOpen((v) => !v)} active={pickerOpen} title="Link to file">
            <Icon name="file" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code block"
          >
            <Icon name="codeBlock" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
            title="Insert table"
          >
            <Icon name="table" size={14} />
          </TbBtn>
          <TbBtn
            onClick={() => {
              const url = prompt('Image URL:');
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            title="Insert image"
          >
            <Icon name="image" size={14} />
          </TbBtn>
        </div>
      </div>

      {pickerOpen && editor && <FileLinkPicker editor={editor} onClose={() => setPickerOpen(false)} />}
    </>
  );
}
