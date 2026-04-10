import { render } from '@testing-library/react';
import { ResizableSplit } from '../../src/components/ResizableSplit.jsx';

it('renders sidebar and content slots', () => {
  const { getByText } = render(<ResizableSplit sidebar={<div>Sidebar</div>} content={<div>Content</div>} />);
  expect(getByText('Sidebar')).toBeInTheDocument();
  expect(getByText('Content')).toBeInTheDocument();
});
