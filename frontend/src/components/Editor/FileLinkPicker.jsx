import { useState, useEffect, useRef } from 'react';
import { searchFiles } from '../../api.js';
import { titleFromPath } from '../../utils/fileLinks.js';

/**
 * A small dropdown search picker that inserts a markdown file link
 * into the TipTap editor at the current cursor position.
 *
 * Props:
 *   editor   — the TipTap editor instance
 *   onClose  — called when the picker should close
 */
export function FileLinkPicker({ editor, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let aborted = false;
    searchFiles(query)
      .then((r) => {
        if (!aborted) setResults(r);
      })
      .catch(() => {
        if (!aborted) setResults([]);
      });
    return () => {
      aborted = true;
    };
  }, [query]);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  const insertLink = (path) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const title = selectedText || titleFromPath(path);

    if (selectedText) {
      // Wrap the selected text with a link mark
      editor.chain().focus().setLink({ href: path }).run();
    } else {
      // Insert a new text node with a link mark at cursor
      // (must use the PM schema directly — insertContent with a markdown string
      //  won't produce a link mark in TipTap's internal PM document)
      const { schema } = editor.state;
      const linkMark = schema.marks.link.create({ href: path });
      const textNode = schema.text(title, [linkMark]);
      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) dispatch(tr.insert(from, textNode));
          return true;
        })
        .run();
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      ref={containerRef}
      className="border-b border-wiki-border bg-elevated px-2 py-2 flex flex-col gap-1"
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search files…"
        className="bg-surface border border-wiki-border-bright rounded px-2 py-1 text-sm text-wiki-text outline-none w-full font-mono"
      />
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto">
          {results.map((r) => (
            <li key={r.path}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // mousedown fires before blur, so we prevent the input losing focus
                  // before we can read the editor selection
                  e.preventDefault();
                  insertLink(r.path);
                }}
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-surface text-wiki-muted hover:text-wiki-text transition-colors font-mono truncate"
              >
                {r.path}
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && results.length === 0 && <p className="text-xs text-wiki-faint px-2 py-1">No results</p>}
    </div>
  );
}
