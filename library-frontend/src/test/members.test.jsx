import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import MemberList from '../pages/Members/MemberList';
import memberService from '../api/memberService';
import { useAuth } from '../context/AuthContext';
vi.mock('../api/memberService', () => ({ default: { getAllMembers: vi.fn(), getErrorMessage: () => 'Server unavailable' } }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
beforeEach(() => {
  useAuth.mockReturnValue({ role: 'LIBRARIAN' });
  memberService.getAllMembers.mockResolvedValue({ content: [], totalPages: 0, totalElements: 0 });
});
afterEach(cleanup);
it('shows an empty directory without account creation controls for librarians', async () => {
  render(<MemberList />);
  await screen.findByText('No members found');
  expect(screen.queryByRole('button', { name: /add member/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument();
});
it('offers account creation to administrators', async () => {
  useAuth.mockReturnValue({ role: 'ADMIN' });
  render(<MemberList />);
  await screen.findByText('No members found');
  expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
});
it('reports a member-directory request failure', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  memberService.getAllMembers.mockRejectedValueOnce(new Error('offline'));
  render(<MemberList />);
  expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
  vi.restoreAllMocks();
});
