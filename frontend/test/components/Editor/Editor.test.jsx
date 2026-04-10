import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { Editor } from '../../../src/components/Editor/Editor.jsx';

it('renders without crashing when no file is open', () => {
  render(<Editor filePath={null} content="" onChange={() => {}} onImageDrop={() => {}} />);
  expect(screen.getByText('Select a file to start editing')).toBeInTheDocument();
});
