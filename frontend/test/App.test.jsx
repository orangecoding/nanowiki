/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';

vi.mock('../src/api.js', () => ({
  getFiles: vi.fn().mockResolvedValue([]),
  searchFiles: vi.fn().mockResolvedValue([]),
  getContent: vi.fn().mockResolvedValue(''),
  saveContent: vi.fn().mockResolvedValue({}),
  uploadImage: vi.fn().mockResolvedValue({ urlPath: '' }),
  getVersion: vi.fn().mockResolvedValue('0.0.0'),
}));

vi.mock('../src/hooks/useWebSocket.js', () => ({
  useWebSocket: vi.fn(),
}));

it('renders without crashing', async () => {
  const { default: App } = await import('../src/App.jsx');
  render(<App />);
  expect(screen.getByText('Nano')).toBeInTheDocument();
  expect(screen.getByText('Wiki')).toBeInTheDocument();
});
