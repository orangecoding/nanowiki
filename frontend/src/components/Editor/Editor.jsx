import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
import Strike from '@tiptap/extension-strike';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Toolbar } from './Toolbar.jsx';
import { RawEditor } from './RawEditor.jsx';
import { ResizableImage } from './ResizableImage.js';

const lowlight = createLowlight(common);

export function Editor({ filePath, content, onChange, onImageDrop, savedState }) {
  const [rawMode, setRawMode] = useState(false);
  const [rawValue, setRawValue] = useState(content);
  const [imgAlt, setImgAlt] = useState('');
  const [imgSrc, setImgSrc] = useState('');

  // Stable refs so editorProps closure always has latest values
  const onImageDropRef = useRef(onImageDrop);
  useEffect(() => {
    onImageDropRef.current = onImageDrop;
  });
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Markdown,
      Strike,
      Link.configure({ openOnClick: false }),
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
    editorProps: {
      attributes: { class: 'prose max-w-none focus:outline-none min-h-full px-8 py-6' },
      // Intercept drop at ProseMirror level to prevent default handling interfering
      handleDrop(view, event) {
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

  // Keep editorRef in sync
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Reload editor when file changes
  useEffect(() => {
    if (!editor || rawMode) return;
    const current = editor.storage.markdown.getMarkdown();
    if (current !== content) {
      editor.commands.setContent(content);
    }
  }, [content, filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rawMode) setRawValue(content);
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
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-wiki-faint text-sm bg-base">
        <span className="text-2xl opacity-30">✎</span>
        Select a file to start editing
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base" onDragOver={(e) => e.preventDefault()}>
      <Toolbar editor={editor} rawMode={rawMode} onToggleRaw={toggleRaw} savedState={savedState} />
      <div className="flex-1 overflow-y-auto">
        {rawMode ? (
          <RawEditor value={rawValue} onChange={handleRawChange} />
        ) : (
          <>
            {editor && (
              <BubbleMenu
                editor={editor}
                shouldShow={() => editor.isActive('image')}
                onShow={() => {
                  const attrs = editor.getAttributes('image');
                  setImgSrc(attrs.src ?? '');
                  setImgAlt(attrs.alt ?? '');
                }}
                tippyOptions={{ placement: 'bottom', duration: 100 }}
              >
                <div className="flex items-center gap-1.5 bg-elevated border border-wiki-border rounded-md shadow-lg px-2 py-1.5 text-xs">
                  <label className="text-wiki-faint shrink-0">Alt</label>
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
                    className="bg-surface border border-wiki-border-bright rounded px-1.5 py-0.5 text-wiki-text outline-none w-28 font-mono"
                  />
                  <label className="text-wiki-faint shrink-0">Src</label>
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
                    className="bg-surface border border-wiki-border-bright rounded px-1.5 py-0.5 text-wiki-text outline-none w-48 font-mono"
                  />
                  <button
                    onClick={() => {
                      editor.commands.updateAttributes('image', { alt: imgAlt, src: imgSrc });
                      editor.commands.focus();
                    }}
                    className="bg-accent/20 hover:bg-accent/30 text-accent px-2 py-0.5 rounded transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </BubbleMenu>
            )}
            <EditorContent editor={editor} className="h-full" />
          </>
        )}
      </div>
    </div>
  );
}
