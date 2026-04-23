import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authApi = {
  login: (credentials: any) => api.post('/auth/authenticate', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
};

export const bookApi = {
  getAll: () => api.get('/books'),
  getByIsbn: (isbn: string) => api.get(`/books/isbn/${isbn}`),
  add: (book: any) => api.post('/books', book),
  search: (params: { title?: string; author?: string }) => api.get('/books/search', { params }),
  update: (id: number, book: any) => api.put(`/books/${id}`, book),
  delete: (id: number) => api.delete(`/books/${id}`),
};

export const memberApi = {
  getAll: () => api.get('/members'),
  getById: (id: number) => api.get(`/members/${id}`),
  add: (member: any) => api.post('/members', member),
  search: (name: string) => api.get('/members/search', { params: { name } }),
  update: (id: number, member: any) => api.put(`/members/${id}`, member),
  delete: (id: number) => api.delete(`/members/${id}`),
};

export const borrowingApi = {
  borrow: (memberId: number, bookId: number) => 
    api.post('/borrowings/borrow', null, { params: { memberId, bookId } }),
  returnBook: (recordId: number) => api.post(`/borrowings/return/${recordId}`),
  getMemberHistory: (memberId: number) => api.get(`/borrowings/member/${memberId}`),
};

export default api;
