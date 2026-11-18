import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookList from '../pages/Catalog/BookList';
import bookService from '../api/bookService';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ role: 'ADMIN', user: null }) }));
vi.mock('../api/bookService', () => ({ default: {
  getAllBooks: vi.fn(), searchBooks: vi.fn(), getErrorMessage: () => 'Server unavailable',
} }));

const book = { id: 1, title: 'Reliable Catalogs', author: 'Writer', genre: 'Fiction',
  availableCopies: 2, totalCopies: 3 };
const page = (content) => ({ content, totalPages: content.length ? 1 : 0, totalElements: content.length });

const expectNoEmptyState = () => {
  expect(screen.queryByRole('heading', { name: 'No books found' })).not.toBeInTheDocument();
  expect(screen.queryByText(/the library catalog is currently empty/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/we could not find any books matching/i)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add Your First Book' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Clear All Filters' })).not.toBeInTheDocument();
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  bookService.getAllBooks.mockResolvedValue(page([]));
  bookService.searchBooks.mockResolvedValue(page([]));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('shows only the error and recovery action when the initial request fails', async () => {
  bookService.getAllBooks.mockRejectedValueOnce(new Error('offline'));
  render(<BookList />);

  expect(await screen.findByRole('heading', { name: 'Failed to load catalog data' })).toBeInTheDocument();
  expect(screen.getByText('Server unavailable')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  expectNoEmptyState();
});

it('shows catalog-empty guidance only after a successful empty response', async () => {
  render(<BookList />);

  await screen.findByRole('heading', { name: 'No books found' });
  expect(screen.getByText(/the library catalog is currently empty/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add Your First Book' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
});

it('shows no-matches guidance after a successful filtered empty response', async () => {
  bookService.getAllBooks.mockResolvedValue(page([book]));
  render(<BookList />);
  await screen.findByText(book.title);

  fireEvent.change(screen.getByRole('textbox', { name: 'Search books by title' }), { target: { value: 'Missing' } });

  await screen.findByRole('heading', { name: 'No books found' });
  expect(bookService.searchBooks).toHaveBeenCalledWith(expect.objectContaining({ title: 'Missing' }));
  expect(screen.getByText(/we could not find any books matching/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Clear All Filters' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add Your First Book' })).not.toBeInTheDocument();
});

it('removes an earlier empty state when a subsequent filtered request fails', async () => {
  bookService.searchBooks.mockRejectedValueOnce(new Error('offline'));
  render(<BookList />);
  await screen.findByRole('heading', { name: 'No books found' });

  fireEvent.change(screen.getByRole('textbox', { name: 'Search books by title' }), { target: { value: 'Missing' } });

  await screen.findByRole('heading', { name: 'Failed to load catalog data' });
  expectNoEmptyState();
});

it.each([
  ['populated', [book]],
  ['empty', []],
])('recovers from repeated failures to a successful %s response', async (_, content) => {
  let completeRetry;
  bookService.getAllBooks
    .mockRejectedValueOnce(new Error('offline'))
    .mockRejectedValueOnce(new Error('still offline'))
    .mockImplementationOnce(() => new Promise((resolve) => { completeRetry = resolve; }));
  render(<BookList />);
  await screen.findByRole('button', { name: 'Retry' });

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(bookService.getAllBooks).toHaveBeenCalledTimes(2));
  await screen.findByRole('button', { name: 'Retry' });
  expectNoEmptyState();

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expectNoEmptyState();
  expect(screen.queryByRole('heading', { name: 'Failed to load catalog data' })).not.toBeInTheDocument();
  completeRetry(page(content));

  if (content.length) {
    await screen.findByText(book.title);
    expectNoEmptyState();
  } else {
    await screen.findByRole('heading', { name: 'No books found' });
    expect(screen.getByRole('button', { name: 'Add Your First Book' })).toBeInTheDocument();
  }
  expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
});

it('retains previously loaded books alongside the error when refreshing fails', async () => {
  bookService.getAllBooks
    .mockResolvedValueOnce(page([book]))
    .mockRejectedValueOnce(new Error('offline'));
  render(<BookList />);
  await screen.findByText(book.title);

  fireEvent.click(screen.getByRole('button', { name: 'Refresh catalog data' }));

  await screen.findByRole('heading', { name: 'Failed to load catalog data' });
  expect(screen.getByText(book.title)).toBeInTheDocument();
  expectNoEmptyState();
});
