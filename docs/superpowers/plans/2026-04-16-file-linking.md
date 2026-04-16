# File Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users link markdown files to one another using standard markdown syntax, with click navigation, drag-and-drop from the file tree, and a toolbar file picker.

**Architecture:** Pure utility functions handle title generation and path resolution; click navigation is intercepted in TipTap's `editorProps.handleClick`; drag-and-drop extends the existing `handleDrop`; the file picker is a new self-contained component rendered inside the Toolbar.

**Tech Stack:** React 19, TipTap 3, Vitest, @testing-library/react

---

## File Map

| Action | Path                                                |
| ------ | --------------------------------------------------- |
| Create | `frontend/src/utils/fileLinks.js`                   |
| Create | `frontend/src/utils/fileLinks.test.js`              |
| Create | `frontend/src/components/Editor/FileLinkPicker.jsx` |
| Modify | `frontend/src/components/Editor/Editor.jsx`         |
| Modify | `frontend/src/components/Editor/Toolbar.jsx`        |
| Modify | `frontend/src/components/FileTree/FileTree.jsx`     |
| Modify | `frontend/src/App.jsx`                              |

---

## Task 1: Utility functions

**Files:**

- Create: `frontend/src/utils/fileLinks.js`
- Create: `frontend/src/utils/fileLinks.test.js`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/utils/fileLinks.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { titleFromPath, resolveRelative, flattenTree } from './fileLinks.js';

describe('titleFromPath', () => {
  it('strips .md and capitalizes first letter', () => {
    expect(titleFromPath('readme.md')).toBe('Readme');
  });
  it('replaces hyphens with spaces', () => {
    expect(titleFromPath('meeting-notes.md')).toBe('Meeting Notes');
  });
  it('replaces underscores with spaces', () => {
    expect(titleFromPath('project_ideas.md')).toBe('Project Ideas');
  });
  it('preserves all-caps like README', () => {
    expect(titleFromPath('README.md')).toBe('README');
  });
  it('handles a path with directories — uses only the filename', () => {
    expect(titleFromPath('docs/meeting-notes.md')).toBe('Meeting Notes');
  });
});

describe('resolveRelative', () => {
  it('resolves a sibling file', () => {
    expect(resolveRelative('other.md', 'notes/project.md')).toBe('notes/other.md');
  });
  it('resolves a parent-relative path', () => {
    expect(resolveRelative('../ideas/brainstorm.md', 'notes/project.md')).toBe('ideas/brainstorm.md');
  });
  it('resolves from a root-level file', () => {
    expect(resolveRelative('folder/file.md', 'root.md')).toBe('folder/file.md');
  });
  it('resolves a same-directory dot-prefix', () => {
    expect(resolveRelative('./other.md', 'notes/project.md')).toBe('notes/other.md');
  });
});

describe('flattenTree', () => {
  it('returns all file paths from a nested tree', () => {
    const tree = [
      { type: 'folder', path: 'a', children: [{ type: 'file', path: 'a/b.md', children: [] }] },
      { type: 'file', path: 'c.md', children: [] },
    ];
    expect(flattenTree(tree)).toEqual(['a/b.md', 'c.md']);
  });
  it('returns empty array for empty tree', () => {
    expect(flattenTree([])).toEqual([]);
  });
  it('ignores folder entries themselves', () => {
    const tree = [{ type: 'folder', path: 'docs', children: [] }];
    expect(flattenTree(tree)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/utils/fileLinks.test.js
```

Expected: errors like `Cannot find module './fileLinks.js'`

- [ ] **Step 3: Implement the utilities**

Create `frontend/src/utils/fileLinks.js`:

```js
/**
 * Derive a display title from a file path.
 * Uses only the filename (last segment), strips .md,
 * replaces - and _ with spaces, capitalizes the first letter.
 *
 * "docs/meeting-notes.md" → "Meeting Notes"
 * "README.md"             → "README"
 */
export function titleFromPath(path) {
  const filename = path.split('/').pop() ?? path;
  const stem = filename.replace(/\.md$/i, '');
  const spaced = stem.replace(/[-_]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Resolve `href` relative to `currentFilePath`.
 * Handles `..`, `.`, and plain sibling paths.
 *
 * resolveRelative('other.md', 'notes/project.md') → 'notes/other.md'
 * resolveRelative('../ideas/x.md', 'notes/p.md')  → 'ideas/x.md'
 */
export function resolveRelative(href, currentFilePath) {
  const dir = currentFilePath.split('/').slice(0, -1).join('/');
  const base = dir ? `${dir}/${href}` : href;
  const parts = base.split('/');
  const result = [];
  for (const part of parts) {
    if (part === '..') result.pop();
    else if (part !== '.') result.push(part);
  }
  return result.join('/');
}

/**
 * Flatten a nested file tree into a flat array of file paths.
 * Folder paths are excluded; only file paths are returned.
 */
export function flattenTree(nodes) {
  const paths = [];
  for (const node of nodes) {
    if (node.type === 'file') paths.push(node.path);
    if (node.children?.length) paths.push(...flattenTree(node.children));
  }
  return paths;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/utils/fileLinks.test.js
```

Expected: all 9 tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/fileLinks.js frontend/src/utils/fileLinks.test.js
git commit -m "feat: add file link utilities (titleFromPath, resolveRelative, flattenTree)"
```

---

## Task 2: Click navigation

**Files:**

- Modify: `frontend/src/components/Editor/Editor.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add `onNavigate` prop and `handleClick` to Editor.jsx**

In `frontend/src/components/Editor/Editor.jsx`, make these changes:

1. Add `onNavigate` to the function signature:

```js
export function Editor({ filePath, content, onChange, onImageDrop, savedState, onNavigate }) {
```

2. Add a stable ref for `onNavigate` (after the existing `onImageDropRef`):

```js
const onNavigateRef = useRef(onNavigate);
useEffect(() => {
  onNavigateRef.current = onNavigate;
});
```

3. Inside `editorProps`, add a `handleClick` handler after `handleDrop`:

```js
handleClick(view, pos, event) {
  const target = event.target.closest('a');
  if (!target) return false;
  const href = target.getAttribute('href');
  // Only intercept .md paths without a protocol (not https://, mailto:, etc.)
  if (!href || href.includes('://') || !href.endsWith('.md')) return false;
  event.preventDefault();
  onNavigateRef.current?.(href);
  return true;
},
```

- [ ] **Step 2: Implement `handleNavigate` in App.jsx**

In `frontend/src/App.jsx`:

1. Add the import at the top:

```js
import { flattenTree, resolveRelative } from './utils/fileLinks.js';
```

2. Add `handleNavigate` after `handleWsEvent`:

```js
const handleNavigate = useCallback(
  (href) => {
    const paths = flattenTree(tree);

    // Try relative to current file first
    if (activePath) {
      const relative = resolveRelative(href, activePath);
      if (paths.includes(relative)) {
        // Open all ancestor folders
        const segments = relative.split('/');
        for (let i = 1; i < segments.length; i++) {
          openFolder(segments.slice(0, i).join('/'));
        }
        setActivePath(relative);
        return;
      }
    }

    // Fall back to root-relative
    if (paths.includes(href)) {
      const segments = href.split('/');
      for (let i = 1; i < segments.length; i++) {
        openFolder(segments.slice(0, i).join('/'));
      }
      setActivePath(href);
      return;
    }

    // Not an internal file — open externally
    window.open(href, '_blank', 'noopener,noreferrer');
  },
  [activePath, tree, openFolder],
);
```

3. Pass `onNavigate` to `<Editor>` in the `editorPanel` declaration:

```jsx
const editorPanel = (
  <Editor
    filePath={activePath}
    content={content}
    onChange={setContent}
    onImageDrop={handleImageDrop}
    savedState={savedState}
    onNavigate={handleNavigate}
  />
);
```

- [ ] **Step 3: Manual smoke test**

Start the dev server (`cd frontend && npm run dev`). Create two markdown files. In one, type `[Go to other](other-file.md)`. Click the link in the editor. Verify the second file opens.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Editor/Editor.jsx frontend/src/App.jsx
git commit -m "feat: navigate to linked .md files on click"
```

---

## Task 3: Drag-and-drop from file tree

**Files:**

- Modify: `frontend/src/components/FileTree/FileTree.jsx`
- Modify: `frontend/src/components/Editor/Editor.jsx`

- [ ] **Step 1: Make file nodes draggable in FileTree.jsx**

In `frontend/src/components/FileTree/FileTree.jsx`, update the `NodeRow` component's root `<div>` to add drag support for file nodes.

In `NodeRow`, add an `onDragStart` handler and `draggable` attribute. Change the outer `<div>` from:

```jsx
<div
  data-active={isActive ? '' : undefined}
  onClick={handleClick}
  onContextMenu={handleContextMenu}
  style={{ paddingLeft: depth * 14 + 8 }}
  className={...}
>
```

to:

```jsx
<div
  data-active={isActive ? '' : undefined}
  draggable={!isFolder}
  onDragStart={
    !isFolder
      ? (e) => {
          e.dataTransfer.setData('application/x-nanowiki-path', node.path);
          e.dataTransfer.effectAllowed = 'copy';
        }
      : undefined
  }
  onClick={handleClick}
  onContextMenu={handleContextMenu}
  style={{ paddingLeft: depth * 14 + 8 }}
  className={...}
>
```

- [ ] **Step 2: Handle the drop in Editor.jsx**

In `frontend/src/components/Editor/Editor.jsx`, import `titleFromPath` at the top:

```js
import { titleFromPath } from '../../utils/fileLinks.js';
```

Then update the `handleDrop` inside `editorProps` to check for the nanowiki drag type **before** the existing image logic. Replace the current `handleDrop` with:

```js
handleDrop(view, event) {
  // Check for internal file drag first
  const filePath = event.dataTransfer?.getData('application/x-nanowiki-path');
  if (filePath) {
    event.preventDefault();
    const title = titleFromPath(filePath);
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (pos) {
      // Insert a proper ProseMirror text node with a link mark
      // (not raw markdown text — TipTap stores a PM document internally)
      const { schema } = view.state;
      const linkMark = schema.marks.link.create({ href: filePath });
      const textNode = schema.text(title, [linkMark]);
      view.dispatch(view.state.tr.insert(pos.pos, textNode));
    }
    return true;
  }

  // Existing image drop logic
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
```

- [ ] **Step 3: Manual smoke test**

With the dev server running, drag a file from the tree into the editor. Verify a markdown link like `[Meeting Notes](notes/meeting-notes.md)` is inserted at the drop position.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/FileTree/FileTree.jsx frontend/src/components/Editor/Editor.jsx
git commit -m "feat: drag files from tree into editor to insert markdown link"
```

---

## Task 4: Toolbar file picker

**Files:**

- Create: `frontend/src/components/Editor/FileLinkPicker.jsx`
- Modify: `frontend/src/components/Editor/Toolbar.jsx`

- [ ] **Step 1: Create FileLinkPicker.jsx**

Create `frontend/src/components/Editor/FileLinkPicker.jsx`:

```jsx
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    searchFiles(query)
      .then(setResults)
      .catch(() => setResults([]));
  }, [query]);

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
    <div className="border-b border-wiki-border bg-elevated px-2 py-2 flex flex-col gap-1" onKeyDown={handleKeyDown}>
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
```

- [ ] **Step 2: Add the "Link File" button and picker to Toolbar.jsx**

In `frontend/src/components/Editor/Toolbar.jsx`:

1. Add the import at the top:

```js
import { useState } from 'react';
import { FileLinkPicker } from './FileLinkPicker.jsx';
```

2. Change the export signature to return a fragment that includes the picker panel. Replace:

```jsx
export function Toolbar({ editor, rawMode, onToggleRaw, savedState }) {
  if (!editor && !rawMode) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-wiki-border bg-surface flex-wrap">
```

with:

```jsx
export function Toolbar({ editor, rawMode, onToggleRaw, savedState }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!editor && !rawMode) return null;

  return (
    <>
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-wiki-border bg-surface flex-wrap">
```

3. Add the "Link File" button just after the existing `🔗` URL link button (after its closing `</ToolBtn>`):

```jsx
<ToolBtn onClick={() => setPickerOpen((v) => !v)} active={pickerOpen} title="Link file">
  📄🔗
</ToolBtn>
```

4. Close the fragment after the closing `</div>` of the toolbar row and conditionally render the picker:

```jsx
    </div>
    {pickerOpen && editor && (
      <FileLinkPicker editor={editor} onClose={() => setPickerOpen(false)} />
    )}
    </>
  );
}
```

- [ ] **Step 3: Manual smoke test**

With the dev server running:

- Click the "📄🔗" button. The search input appears below the toolbar.
- Type part of a filename. Results appear.
- Click a result. A `[Title](path)` link is inserted at the cursor. The picker closes.
- Press `Escape` while the picker is open. It closes.
- If text is selected in the editor before opening the picker and selecting a file, the selected text becomes the link title.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Editor/FileLinkPicker.jsx frontend/src/components/Editor/Toolbar.jsx
git commit -m "feat: add toolbar file picker to insert markdown links"
```
