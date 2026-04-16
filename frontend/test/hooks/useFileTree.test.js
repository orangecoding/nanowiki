/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.doMock('../../src/api.js', () => ({
    getFiles: vi.fn().mockResolvedValue([{ type: 'file', name: 'readme.md', path: 'readme.md' }]),
    createEntry: vi.fn().mockResolvedValue({}),
    deleteEntry: vi.fn().mockResolvedValue(null),
    renameEntry: vi.fn().mockResolvedValue({}),
  }));
});

it('loads file tree on mount', async () => {
  const { useFileTree } = await import('../../src/hooks/useFileTree.js');
  const { result } = renderHook(() => useFileTree());
  await act(async () => {});
  expect(result.current.tree[0].name).toBe('readme.md');
});
