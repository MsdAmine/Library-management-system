import React from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import BookList from '../pages/Catalog/BookList';
import { useAuth } from '../context/AuthContext';
import bookService from '../api/bookService';
import borrowingService from '../api/borrowingService';
import reservationService from '../api/reservationService';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../api/bookService', () => ({ default: {
  getAllBooks: vi.fn(), searchBooks: vi.fn(), getErrorMessage: (error) => error.message,
} }));
vi.mock('../api/borrowingService', () => ({ default: {
  borrowBook: vi.fn(), getErrorMessage: (error) => error.message,
} }));
vi.mock('../api/reservationService', () => ({ default: {
  getMyHolds: vi.fn(), placeHold: vi.fn(), getErrorMessage: (error) => error.message,
} }));

const book = { id: 7, title: 'Member Checkout', author: 'Writer', genre: 'Fiction',
  availableCopies: 1, totalCopies: 1 };
const page = (content) => ({ content, totalPages: 1, totalElements: content.length });
const member = { role: 'USER', user: { id: 42, email: 'member@example.test' } };

// jsdom does not implement native dialog methods. Keyboard containment is checked in Chrome.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuth.mockReturnValue(member);
  bookService.getAllBooks.mockResolvedValue(page([book]));
  bookService.searchBooks.mockResolvedValue(page([book]));
  reservationService.getMyHolds.mockResolvedValue([]);
  borrowingService.borrowBook.mockResolvedValue({ id: 10, dueDate: '2030-02-15' });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function openCatalog(view = 'Table') {
  render(<BookList />);
  await screen.findByText(book.title);
  if (view === 'Cards') fireEvent.click(screen.getByRole('button', { name: 'Cards', exact: true }));
}

it.each(['Table', 'Cards'])('lets a member confirm borrowing in %s view and refreshes stock and holds', async (view) => {
  localStorage.setItem('userId', '999');
  await openCatalog(view);
  fireEvent.click(screen.getByRole('button', { name: 'Borrow Book', exact: true }));

  const dialog = screen.getByRole('dialog', { name: 'Borrow Book' });
  expect(within(dialog).getByText(book.title)).toBeInTheDocument();
  expect(within(dialog).getByText(/confirming creates a loan on your account immediately/i)).toHaveTextContent('14 days');
  expect(borrowingService.borrowBook).not.toHaveBeenCalled();
  bookService.getAllBooks.mockResolvedValue(page([{ ...book, availableCopies: 0 }]));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm Borrow' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(borrowingService.borrowBook).toHaveBeenCalledExactlyOnceWith(42, 7);
  expect(screen.getByRole('status')).toHaveTextContent(`You borrowed "${book.title}".`);
  expect(screen.getByRole('status')).toHaveTextContent(new Date('2030-02-15T00:00:00').toLocaleDateString());
  await screen.findByRole('button', { name: /Reserve \/ (Hold|Place Hold)/ });
  expect(bookService.getAllBooks).toHaveBeenCalledTimes(2);
  expect(reservationService.getMyHolds).toHaveBeenCalledTimes(2);
});

it.each(['Cancel', 'Escape'])('cancels without a borrowing request using %s', async (action) => {
  await openCatalog();
  const trigger = screen.getByRole('button', { name: 'Borrow Book', exact: true });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog');
  if (action === 'Cancel') fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  else fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(borrowingService.borrowBook).not.toHaveBeenCalled();
  expect(trigger).toHaveFocus();
});

it('blocks duplicate confirmation and dismissal while a borrowing request is pending', async () => {
  let complete;
  borrowingService.borrowBook.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
  await openCatalog();
  fireEvent.click(screen.getByRole('button', { name: 'Borrow Book', exact: true }));
  const dialog = screen.getByRole('dialog');
  const confirm = within(dialog).getByRole('button', { name: 'Confirm Borrow' });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));

  expect(borrowingService.borrowBook).toHaveBeenCalledTimes(1);
  expect(within(dialog).getByRole('button', { name: 'Borrowing...' })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Close borrow confirmation' })).toBeDisabled();
  expect(dialog).toBeInTheDocument();
  await act(async () => complete({ dueDate: '2030-02-15' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it.each([
  'No copies available for this book.',
  'Member has reached the maximum allowed borrowed books limit of 5.',
  'Pending fines exceed $10. Please settle outstanding fines.',
])('shows the borrowing failure and allows retry: %s', async (message) => {
  borrowingService.borrowBook.mockRejectedValueOnce(new Error(message));
  await openCatalog();
  fireEvent.click(screen.getByRole('button', { name: 'Borrow Book', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Borrow' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(bookService.getAllBooks).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Borrow' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(borrowingService.borrowBook).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('status')).toHaveTextContent('You borrowed');
});

it.each(['ADMIN', 'LIBRARIAN', null])('hides member borrowing controls for role %s', async (role) => {
  useAuth.mockReturnValue({ role, user: role ? { id: 5 } : null });
  await openCatalog();
  expect(screen.queryByRole('button', { name: 'Borrow Book', exact: true })).not.toBeInTheDocument();
  if (role) expect(screen.getByRole('button', { name: 'Add New Book' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cards', exact: true }));
  expect(screen.queryByRole('button', { name: 'Borrow Book', exact: true })).not.toBeInTheDocument();
});

it('does not submit a borrowing request when the signed-in member ID is missing', async () => {
  useAuth.mockReturnValue({ role: 'USER', user: { email: 'member@example.test' } });
  await openCatalog();
  fireEvent.click(screen.getByRole('button', { name: 'Borrow Book', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm Borrow' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please sign in again');
  expect(borrowingService.borrowBook).not.toHaveBeenCalled();
});

it.each(['Table', 'Cards'])('preserves reservation and pickup actions in %s view', async (view) => {
  bookService.getAllBooks.mockResolvedValue(page([{ ...book, availableCopies: 0 }]));
  reservationService.getMyHolds.mockResolvedValue([{ bookId: book.id, status: 'HELD_FOR_PICKUP' }]);
  await openCatalog(view);
  expect(screen.queryByRole('button', { name: 'Borrow Book', exact: true })).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'Ready for Pickup - Claim Book' }));
  await waitFor(() => expect(borrowingService.borrowBook).toHaveBeenCalledExactlyOnceWith(42, 7));
});
