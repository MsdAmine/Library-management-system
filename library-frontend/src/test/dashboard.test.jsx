import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { fineService } from '../api/fineService';
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'admin@test.local' }, role: 'ADMIN' }) }));
vi.mock('../api/analyticsService', () => ({ analyticsService: { getAnalytics: async () => ({ borrowings: { overdueBorrowings: 5 } }) } }));
vi.mock('../api/fineService', () => ({ fineService: { getAllFines: vi.fn() } }));
afterEach(cleanup);
it.each([
  [[{ status: 'PAID' }, { status: 'WAIVED' }], '0'],
  [[{ status: 'PENDING' }, { status: 'PAID' }], '1'],
  [[], '0'],
])('counts pending fines independently of overdue loans and settled fines', async (fines, expected) => {
  fineService.getAllFines.mockResolvedValue(fines);
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => {
    const metric = screen.getByText('Pending Fines').parentElement;
    expect(metric.querySelector('.text-xl, .text-lg')).toHaveTextContent(expected);
  });
});
