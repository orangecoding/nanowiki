/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState } from 'react';
import { FileLinkPicker } from './FileLinkPicker.jsx';

const Divider = () => <div className="w-px h-4 bg-wiki-border mx-1 flex-shrink-0" />;

function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`px-2 py-1 rounded text-sm font-mono transition-colors flex-shrink-0 ${
        active
          ? 'bg-accent/20 text-accent border border-accent/30'
          : 'text-wiki-muted hover:text-wiki-text hover:bg-elevated'
      }`}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor, rawMode, onToggleRaw, savedState }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!editor && !rawMode) return null;

  return (
    <>
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-wiki-border bg-surface flex-wrap">
        {!rawMode && editor && (
          <>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold"
            >
              B
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic"
            >
              <i>I</i>
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              ~~
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Inline code"
            >
              `
            </ToolBtn>
            <Divider />
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              H1
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolBtn>
            <Divider />
            <ToolBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet list"
            >
              • List
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Ordered list"
            >
              1. List
            </ToolBtn>
            <Divider />
            <ToolBtn
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              active={editor.isActive('link')}
              title="Link"
            >
              🔗
            </ToolBtn>
            <ToolBtn onClick={() => setPickerOpen((v) => !v)} active={pickerOpen} title="Link file">
              📄🔗
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              title="Code block"
            >
              ⌨
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()}
              title="Insert table"
            >
              ⊞
            </ToolBtn>
            <Divider />
          </>
        )}
        <ToolBtn onClick={onToggleRaw} active={rawMode} title="Toggle raw Markdown">
          &lt;/&gt; Raw MD
        </ToolBtn>
        {savedState === 'saving' && <span className="ml-2 text-xs text-wiki-faint">Saving…</span>}
        {savedState === 'saved' && <span className="ml-2 text-xs text-accent">Saved ✓</span>}
      </div>
      {pickerOpen && editor && <FileLinkPicker editor={editor} onClose={() => setPickerOpen(false)} />}
    </>
  );
}
