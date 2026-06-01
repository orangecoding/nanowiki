/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useEditor as useTiptap, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
import Strike from '@tiptap/extension-strike';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { Toolbar } from './Toolbar.jsx';
import { RawEditor } from './RawEditor.jsx';
import { ResizableImage } from './ResizableImage.js';
import { Icon } from '../Icon.jsx';
import { titleFromPath } from '../../utils/fileLinks.js';

const lowlight = createLowlight(common);

function SavePill({ dirty, savedState }) {
  const state =
    dirty && savedState === 'idle'
      ? 'dirty'
      : savedState === 'saving'
        ? 'saving'
        : savedState === 'saved'
          ? 'saved'
          : null;

  if (!state) return null;
  if (state === 'saving')
    return (
      <span className="savepill savepill--saving">
        <span className="savepill__dot" />
        Saving…
      </span>
    );
  if (state === 'dirty')
    return (
      <span className="savepill savepill--dirty">
        <span className="savepill__dot" />
        Unsaved changes
      </span>
    );
  return (
    <span className="savepill savepill--saved">
      <span className="savepill__dot" />
      <Icon name="check" size={12} />
      Saved
    </span>
  );
}

function Breadcrumb({ path }) {
  const segments = path.split('/');
  return (
    <div className="crumbs">
      {segments.map((seg, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && (
            <span className="crumbs__sep">
              <Icon name="chevron" size={11} />
            </span>
          )}
          <span className="crumbs__item">{i === segments.length - 1 ? seg.replace(/\.md$/, '') : seg}</span>
        </span>
      ))}
    </div>
  );
}

const HISTORY_REVISIONS = [
  { id: 0, label: 'Current version', meta: 'Auto-saved', ago: 'just now', current: true },
  { id: 1, label: 'Edited', meta: 'Added content', ago: '12 min ago', current: false },
  { id: 2, label: 'Edited', meta: 'Minor changes', ago: '1 hr ago', current: false },
  { id: 3, label: 'Created', meta: 'Initial version', ago: 'yesterday', current: false },
];

function HistoryPanel({ onClose }) {
  const revisions = HISTORY_REVISIONS;

  return (
    <div className="history">
      <div className="history__head">
        <div className="history__title">Version history</div>
        <div className="history__sub">{revisions.length} revisions · autosaved</div>
      </div>
      <div className="history__list">
        {revisions.map((r) => (
          <div key={r.id} className={`hrev${r.current ? ' hrev--now' : ''}`}>
            <div className="hrev__rail">
              <span className="hrev__dot" />
              <span className="hrev__line" />
            </div>
            <div className="hrev__body">
              <div className="hrev__when">
                {r.label} <span className="hrev__time">· {r.ago}</span>
              </div>
              <div className="hrev__meta">{r.meta}</div>
            </div>
            {!r.current && (
              <button className="hrev__restore" onClick={onClose}>
                Restore
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Editor({
  filePath,
  content,
  onChange,
  onImageDrop,
  savedState,
  dirty,
  onNavigate,
  canvasRef: canvasRefProp,
}) {
  const [rawMode, setRawMode] = useState(false);
  const [rawValue, setRawValue] = useState(content);
  const [imgAlt, setImgAlt] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [imageMenuVisible, setImageMenuVisible] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const internalCanvasRef = useRef(null);
  const canvasRef = canvasRefProp || internalCanvasRef;

  const onImageDropRef = useRef(onImageDrop);
  useEffect(() => {
    onImageDropRef.current = onImageDrop;
  });
  const onNavigateRef = useRef(onNavigate);
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  });
  const editorRef = useRef(null);

  const editor = useTiptap({
    extensions: [
      StarterKit.configure({ codeBlock: false, strike: false, link: false }),
      Markdown,
      Strike,
      Link.configure({
        openOnClick: false,
        isAllowedUri: (url, ctx) => {
          if (!url.includes(':')) return true;
          return ctx.defaultValidate(url);
        },
      }),
      ResizableImage,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
    onSelectionUpdate: ({ editor }) => {
      const isImage = editor.isActive('image');
      const attrs = isImage ? editor.getAttributes('image') : null;
      startTransition(() => {
        setImageMenuVisible(isImage);
        if (attrs) {
          setImgSrc(attrs.src ?? '');
          setImgAlt(attrs.alt ?? '');
        }
      });
    },
    editorProps: {
      attributes: { class: 'md focus:outline-none min-h-full' },
      handleClick(view, pos, event) {
        const target = event.target.closest('a');
        if (!target) return false;
        const href = target.getAttribute('href');
        if (!href || href.includes(':') || !href.endsWith('.md')) return false;
        if (!onNavigateRef.current) return false;
        event.preventDefault();
        onNavigateRef.current(decodeURI(href));
        return true;
      },
      handleDrop(view, event) {
        const droppedFilePath = event.dataTransfer?.getData('application/x-nanowiki-path');
        if (droppedFilePath) {
          event.preventDefault();
          const title = titleFromPath(droppedFilePath);
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (pos) {
            const { schema } = view.state;
            const linkMark = schema.marks.link.create({ href: encodeURI(droppedFilePath) });
            const textNode = schema.text(title, [linkMark]);
            view.dispatch(view.state.tr.insert(pos.pos, textNode));
          }
          return true;
        }
        const files = [...(event.dataTransfer?.files ?? [])];
        const images = files.filter((f) => f.type.startsWith('image/'));
        if (images.length === 0) return false;
        event.preventDefault();
        for (const file of images) {
          onImageDropRef
            .current?.(file)
            .then((result) => {
              if (result?.urlPath && editorRef.current) {
                const alt = file.name.replace(/\.[^.]+$/, '');
                editorRef.current.chain().focus().setImage({ src: result.urlPath, alt }).run();
              }
            })
            .catch(() => {});
        }
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor || rawMode) return;
    const current = editor.storage.markdown.getMarkdown();
    if (current !== content) editor.commands.setContent(content);
  }, [content, filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rawMode) setRawValue(content);
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editor || rawMode) return;
    const timer = setTimeout(() => editor.commands.focus('start'), 80);
    return () => clearTimeout(timer);
  }, [filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRaw = useCallback(() => {
    if (!rawMode) {
      const md = editor?.storage.markdown.getMarkdown() ?? '';
      setRawValue(md);
      setRawMode(true);
    } else {
      editor?.commands.setContent(rawValue);
      onChange(rawValue);
      setRawMode(false);
    }
  }, [rawMode, editor, rawValue, onChange]);

  const handleRawChange = useCallback(
    (val) => {
      setRawValue(val);
      onChange(val);
    },
    [onChange],
  );

  if (!filePath) {
    return (
      <div className="editor" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
        Select a file to start editing
      </div>
    );
  }

  return (
    <div className="editor" onDragOver={(e) => e.preventDefault()}>
      {/* Breadcrumb bar */}
      <div className="crumbbar">
        <Breadcrumb path={filePath} />
        <div className="crumbbar__spacer" />
        <div className="crumbbar__actions">
          <span className="savepill-desktop">
            <SavePill dirty={dirty} savedState={savedState} />
          </span>

          {/* Version history */}
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              className={`iconbtn${historyOpen ? ' iconbtn--on' : ''}`}
              title="Version history"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              <Icon name="history" size={17} />
            </button>
            {historyOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setHistoryOpen(false)} />
                <div className="pop history" style={{ right: 0, top: 'calc(100% + 8px)', zIndex: 60 }}>
                  <HistoryPanel onClose={() => setHistoryOpen(false)} />
                </div>
              </>
            )}
          </div>

          {/* Editor / Raw toggle */}
          <div className="seg">
            <button className={!rawMode ? 'active' : ''} onClick={() => rawMode && toggleRaw()}>
              Editor
            </button>
            <button className={rawMode ? 'active' : ''} onClick={() => !rawMode && toggleRaw()}>
              <Icon name="code" size={13} />
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* Formatting toolbar (editor mode only) */}
      {!rawMode && <Toolbar editor={editor} />}

      {/* Image attribute bar */}
      {!rawMode && imageMenuVisible && editor && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
            padding: '6px 24px',
            fontSize: 13,
          }}
        >
          <label style={{ color: 'var(--text-faint)', flexShrink: 0 }}>Alt</label>
          <input
            value={imgAlt}
            onChange={(e) => setImgAlt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editor.commands.updateAttributes('image', { alt: imgAlt, src: imgSrc });
                editor.commands.focus();
              }
              e.stopPropagation();
            }}
            placeholder="alt text"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              padding: '2px 8px',
              outline: 'none',
              width: 120,
            }}
          />
          <label style={{ color: 'var(--text-faint)', flexShrink: 0 }}>Src</label>
          <input
            value={imgSrc}
            onChange={(e) => setImgSrc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editor.commands.updateAttributes('image', { alt: imgAlt, src: imgSrc });
                editor.commands.focus();
              }
              e.stopPropagation();
            }}
            placeholder="url"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              padding: '2px 8px',
              outline: 'none',
              width: 200,
            }}
          />
          <button
            onClick={() => {
              editor.commands.updateAttributes('image', { alt: imgAlt, src: imgSrc });
              editor.commands.focus();
            }}
            style={{
              background: 'rgba(224,74,56,0.15)',
              color: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        className="canvas"
        ref={canvasRef}
        onClick={(e) => {
          if (!rawMode && editor && !e.target.closest('.ProseMirror')) {
            editor.commands.focus('end');
          }
        }}
      >
        {rawMode ? (
          <RawEditor value={rawValue} onChange={handleRawChange} />
        ) : (
          <article className="doc" key={filePath}>
            <EditorContent editor={editor} />
          </article>
        )}
      </div>
    </div>
  );
}
