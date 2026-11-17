import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookList from '../pages/Catalog/BookList';
import MemberList from '../pages/Members/MemberList';
import BorrowingList from '../pages/Borrowings/BorrowingList';
import bookService from '../api/bookService';
import memberService from '../api/memberService';
import borrowingService from '../api/borrowingService';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ role: 'ADMIN', user: null }) }));
vi.mock('../api/bookService', () => ({ default: {
  getAllBooks: vi.fn(), searchBooks: vi.fn(), getErrorMessage: () => 'Request failed',
} }));
vi.mock('../api/memberService', () => ({ default: {
  getAllMembers: vi.fn(), searchMembers: vi.fn(), getErrorMessage: () => 'Request failed',
} }));
vi.mock('../api/borrowingService', () => ({ default: {
  getAllBorrowings: vi.fn(), getErrorMessage: () => 'Request failed',
} }));

const book = { id: 1, title: 'Accessible Patterns', author: 'Writer', genre: 'Fiction',
  publicationYear: 2020, availableCopies: 2, totalCopies: 3 };
const member = { id: 1, firstName: 'Alice', lastName: 'Tester', email: 'alice@test.local', membershipDate: '2026-01-01', active: true };
const returnedMember = { ...member, id: 2, firstName: 'Bob' };
const loans = [
  { id: 1, user: member, book, borrowDate: '2026-01-01', dueDate: '2030-01-01', status: 'BORROWED' },
  { id: 2, user: returnedMember, book, borrowDate: '2026-01-01', dueDate: '2030-01-01', returnDate: '2026-01-02', status: 'RETURNED' },
];
const page = (content) => ({ content, totalPages: 3, totalElements: 30 });
beforeEach(() => {
  vi.clearAllMocks();
  bookService.getAllBooks.mockResolvedValue(page([book]));
  bookService.searchBooks.mockResolvedValue(page([book]));
  memberService.getAllMembers.mockResolvedValue(page([member]));
  memberService.searchMembers.mockResolvedValue(page([member]));
  borrowingService.getAllBorrowings.mockResolvedValue(page(loans));
});
afterEach(cleanup);

it('allows catalog search, filtering, clearing, and page sizing through named controls', async () => {
  render(<BookList />);
  await screen.findByRole('combobox', { name: /books per page/i });
  fireEvent.click(screen.getByTitle('Next page'));
  await waitFor(() => expect(bookService.getAllBooks).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter books by genre' }), { target: { value: 'Fiction' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Search books by title' }), { target: { value: 'Accessible' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Filter books by author' }), { target: { value: 'Writer' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'In-Stock Only' }));
  await waitFor(() => expect(bookService.searchBooks).toHaveBeenLastCalledWith(expect.objectContaining({
    title: 'Accessible', author: 'Writer', genre: 'Fiction', available: true, page: 0,
  })));
  fireEvent.click(screen.getByRole('button', { name: 'Clear book title search' }));
  await waitFor(() => expect(bookService.searchBooks).toHaveBeenLastCalledWith(expect.objectContaining({ title: undefined, author: 'Writer' })));
  fireEvent.click(screen.getByRole('button', { name: 'Clear author filter' }));
  fireEvent.change(screen.getByLabelText(/books per page/i), { target: { value: '20' } });
  await waitFor(() => expect(bookService.searchBooks).toHaveBeenLastCalledWith(expect.objectContaining({ size: 20, page: 0, author: undefined })));
});

it('allows named member search and page-size controls to reset pagination', async () => {
  render(<MemberList />);
  await screen.findByRole('combobox', { name: /members per page/i });
  fireEvent.click(screen.getByTitle('Next page'));
  await waitFor(() => expect(memberService.getAllMembers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  fireEvent.change(screen.getByRole('textbox', { name: 'Search members by name' }), { target: { value: 'Alice' } });
  await waitFor(() => expect(memberService.searchMembers).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Alice', page: 0 })));
  fireEvent.click(screen.getByRole('button', { name: 'Clear member search' }));
  await waitFor(() => expect(memberService.getAllMembers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0 })));
  fireEvent.change(screen.getByLabelText(/members per page/i), { target: { value: '20' } });
  await waitFor(() => expect(memberService.getAllMembers).toHaveBeenLastCalledWith(expect.objectContaining({ size: 20, page: 0 })));
});

it('allows named loan search and status controls to filter rows and change page size', async () => {
  render(<BorrowingList />);
  fireEvent.click(screen.getByRole('button', { name: 'All Transactions' }));
  await screen.findByRole('combobox', { name: /loan rows per page/i });
  fireEvent.change(screen.getByRole('combobox', { name: 'Filter loans by status' }), { target: { value: 'RETURNED' } });
  expect(screen.queryByText('Alice Tester')).not.toBeInTheDocument();
  expect(screen.getByText('Bob Tester')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Search loans by member, book, author, or record ID'), { target: { value: 'No match' } });
  expect(screen.queryByText('Bob Tester')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear loan search' }));
  expect(screen.getByText('Bob Tester')).toBeInTheDocument();
  fireEvent.click(screen.getByTitle('Next page'));
  await waitFor(() => expect(borrowingService.getAllBorrowings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  fireEvent.change(screen.getByLabelText(/loan rows per page/i), { target: { value: '25' } });
  await waitFor(() => expect(borrowingService.getAllBorrowings).toHaveBeenLastCalledWith(expect.objectContaining({ size: 25, page: 0 })));
});
