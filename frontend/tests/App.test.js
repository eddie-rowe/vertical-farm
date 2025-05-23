// frontend/tests/App.test.js
import { render, screen } from '@testing-library/react';
import App from '@/app/page'; // Adjust the import based on your file structure

test('renders the app', () => {
    render(<App />);
    const linkElement = screen.getByText(/welcome/i); // Adjust based on your app's content
    expect(linkElement).toBeInTheDocument();
});

/*
test('renders a test item', () => {
    render(<App />);
    const testItemElement = screen.getByText(/Test Item/i); // Adjust based on your app's content
    expect(testItemElement).toBeInTheDocument();
});
*/