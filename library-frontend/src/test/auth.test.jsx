import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Session() {
  const { isAuthenticated, login } = useAuth();
  return <><span>{isAuthenticated ? 'Signed in' : 'Signed out'}</span>
    <button onClick={() => login('member@test.local', 'password')}>Login</button></>;
}
const token = () => 'header.' + btoa(JSON.stringify({ sub: 'member@test.local', role: 'USER', userId: 1,
  exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature';
beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('logs in and clears React state after a 401 response', async () => {
  vi.spyOn(api, 'post').mockResolvedValue({ data: { token: token(), role: 'USER' } });
  render(<AuthProvider><Session /></AuthProvider>);
  fireEvent.click(screen.getByText('Login'));
  await screen.findByText('Signed in');
  const rejection = api.interceptors.response.handlers[0].rejected;
  await expect(rejection({ response: { status: 401 } })).rejects.toEqual({ response: { status: 401 } });
  await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
  expect(localStorage.getItem('token')).toBeNull();
});

it('retains session and current page for business-rule 403 errors', async () => {
  localStorage.setItem('token', token());
  window.history.replaceState({}, '', '/catalog');
  render(<AuthProvider><Session /></AuthProvider>);
  await screen.findByText('Signed in');
  const error = { response: { status: 403, data: { message: 'Borrowing limit reached' } } };
  await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(screen.getByText('Signed in')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/catalog');
});

it('rejects an expired saved token on startup', () => {
  const expired = 'header.' + btoa(JSON.stringify({ sub: 'member', exp: 1 })) + '.signature';
  localStorage.setItem('token', expired);
  render(<AuthProvider><Session /></AuthProvider>);
  expect(screen.getByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});
