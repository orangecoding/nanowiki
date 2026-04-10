import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, it, expect } from 'vitest';
import { SearchBar } from '../../src/components/SearchBar.jsx';

it('calls onSearch with input value', async () => {
  const onSearch = vi.fn();
  render(<SearchBar onSearch={onSearch} results={[]} onSelect={() => {}} />);
  await userEvent.type(screen.getByRole('searchbox'), 'hello');
  expect(screen.getByRole('searchbox')).toHaveValue('hello');
});

it('renders search results', () => {
  const results = [{ path: 'notes/todo.md', snippet: 'buy milk' }];
  render(<SearchBar onSearch={() => {}} results={results} onSelect={() => {}} />);
  expect(screen.getByText('todo.md')).toBeInTheDocument();
  expect(screen.getByText('buy milk')).toBeInTheDocument();
});
