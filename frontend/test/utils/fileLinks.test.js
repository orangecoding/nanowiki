import { describe, it, expect } from 'vitest';
import { titleFromPath, resolveRelative, flattenTree } from '../../src/utils/fileLinks.js';

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
  it('handles a path with directories - uses only the filename', () => {
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
