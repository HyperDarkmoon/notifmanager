import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen on startup', () => {
  render(<App />);
  const loginTitle = screen.getByText(/Notification Manager/i);
  expect(loginTitle).toBeInTheDocument();
});
