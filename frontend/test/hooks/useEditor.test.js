/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.doMock('../../src/api.js', () => ({
    getContent: vi.fn().mockResolvedValue('# Hello'),
    saveContent: vi.fn().mockResolvedValue({}),
  }));
});

it('loads content when filePath is set', async () => {
  const { useEditor } = await import('../../src/hooks/useEditor.js');
  const { result } = renderHook(() => useEditor('readme.md'));
  await act(async () => {});
  expect(result.current.content).toBe('# Hello');
  expect(result.current.dirty).toBe(false);
});

it('marks dirty when content changes', async () => {
  const { useEditor } = await import('../../src/hooks/useEditor.js');
  const { result } = renderHook(() => useEditor('readme.md'));
  await act(async () => {});
  act(() => result.current.setContent('# Changed'));
  expect(result.current.dirty).toBe(true);
});
