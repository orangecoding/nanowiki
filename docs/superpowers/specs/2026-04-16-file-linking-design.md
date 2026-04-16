# File Linking Design

**Date:** 2026-04-16
**Status:** Approved

## Overview

Add the ability to link markdown files to one another in nanowiki. Clicking a link to another `.md` file opens that file in the editor and expands its parent folder(s) in the file tree. Links can be authored by typing standard markdown syntax, dragging a file from the tree into the editor, or using a toolbar file picker.

## Link syntax

Standard markdown links: `[Display Text](path/to/file.md)`

- Non-`.md` links (external URLs, images) are unaffected.
- The href may be root-relative (e.g., `folder/file.md`) or relative to the current file (e.g., `../other/file.md`).

## Path resolution (click navigation)

When a link is clicked in the editor:

1. Try resolving the href relative to the current file's directory.
2. If the resolved path does not match a known file in the tree, fall back to treating the href as root-relative.
3. If still unresolved, open in a new tab (external URL behavior).

## Components affected

### `Editor.jsx`

- Add `onNavigate` prop (called with a resolved file path when an internal link is clicked).
- Extend `editorProps.handleClick` to detect `.md` hrefs, resolve the path, and call `onNavigate`.
- Extend `editorProps.handleDrop` to detect `application/x-nanowiki-path` drag data before the existing image logic. On match: compute title, compute href, insert markdown link at drop position via `insertContentAt`.

### `App.jsx`

- Implement `handleNavigate(path)`:
  - Calls `openFolder` for each ancestor path segment (e.g., `a/b/c.md` opens `a`, then `a/b`).
  - Sets `activePath` to the target path.
- Pass `handleNavigate` to `<Editor>` as `onNavigate`.
- Path validation (checking whether a resolved path exists in the tree) happens inside `handleNavigate` in `App.jsx`, which already has access to `tree`. No need to pass the tree to `Editor`.

### `FileTree.jsx` / `NodeRow`

- File nodes get `draggable={true}` and `onDragStart` that writes the file path to `event.dataTransfer` under the type `application/x-nanowiki-path`.
- Folder nodes are not draggable.

### `Toolbar.jsx`

- Add a "Link File" button (icon: chain link or paperclip). Toggles `fileLinkPickerOpen` state.
- When open, renders `<FileLinkPicker>` below the toolbar.

### `FileLinkPicker.jsx` (new, in `components/Editor/`)

- Search input wired to the existing `searchFiles` API.
- Results list: clicking a result inserts `[Title](path)` at cursor (or wraps selected text as title).
- Closes on `Escape` or blur.
- Title generation: strip `.md` extension, replace `-` and `_` with spaces, capitalize first letter.

## Title generation (shared logic)

```
"meeting-notes.md"  →  "Meeting Notes"
"project_ideas.md"  →  "Project Ideas"
"README.md"         →  "README"
```

Rule: strip `.md`, split on `-` and `_`, join with spaces, capitalize first letter of result.

## Data flow

```
FileTree (drag) ──dragstart──► editor handleDrop ──insertContentAt──► TipTap doc
Toolbar button ──click──► FileLinkPicker ──file selected──► TipTap doc
Editor link click ──handleClick──► onNavigate(path) ──► App.jsx ──► setActivePath + openFolder(ancestors)
```

## Error handling

- If a clicked `.md` link resolves to a path not present in the file tree, treat it as an external link (open in new tab). No error toast.
- If `searchFiles` fails in `FileLinkPicker`, show an empty results state silently (no toast needed for a picker).

## Out of scope

- Backlinks (reverse link index).
- Auto-updating links when a file is renamed or moved.
- Preview on hover.
