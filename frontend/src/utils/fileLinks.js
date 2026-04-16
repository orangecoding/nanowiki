/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

/**
 * Derive a display title from a file path.
 * Uses only the filename (last segment), strips .md,
 * replaces - and _ with spaces, capitalizes each word.
 *
 * "docs/meeting-notes.md" → "Meeting Notes"
 * "README.md"             → "README"
 */
export function titleFromPath(path) {
  const filename = path.split('/').pop();
  const stem = filename.replace(/\.md$/i, '');
  const spaced = stem.replace(/[-_]/g, ' ');
  return spaced
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
    if (part === '..') {
      if (result.length > 0) result.pop();
    } else if (part !== '.') result.push(part);
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
