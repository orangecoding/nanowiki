/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTree } from '../../../src/components/FileTree/FileTree.jsx';

const tree = [
  {
    type: 'folder',
    name: 'notes',
    path: 'notes',
    children: [{ type: 'file', name: 'todo.md', path: 'notes/todo.md' }],
  },
  { type: 'file', name: 'readme.md', path: 'readme.md' },
];

const noop = () => {};

it('renders files and folders', () => {
  render(<FileTree tree={tree} activePath={null} onOpen={noop} onCreate={noop} onRename={noop} onDelete={noop} />);
  expect(screen.getByText('notes')).toBeInTheDocument();
  expect(screen.getByText('readme.md')).toBeInTheDocument();
});

it('calls onOpen when a file is clicked', async () => {
  const onOpen = vi.fn();
  render(<FileTree tree={tree} activePath={null} onOpen={onOpen} onCreate={noop} onRename={noop} onDelete={noop} />);
  await userEvent.click(screen.getByText('readme.md'));
  expect(onOpen).toHaveBeenCalledWith('readme.md');
});

it('highlights the active file', () => {
  render(<FileTree tree={tree} activePath="readme.md" onOpen={noop} onCreate={noop} onRename={noop} onDelete={noop} />);
  expect(screen.getByText('readme.md').closest('[data-active]')).toBeInTheDocument();
});
