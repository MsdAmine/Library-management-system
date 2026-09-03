import api from './axios';

/**
 * Service to handle all Book API endpoints with error extraction and standard responses.
 */
export const bookService = {
  /**
   * Fetch paginated list of books.
   * @param {Object} params - { page = 0, size = 10, sort = 'title' }
   */
  async getAllBooks({ page = 0, size = 10, sort = 'title' } = {}) {
    const response = await api.get('/books', {
      params: { page, size, sort },
    });
    return response.data;
  },

  /**
   * Search books with multiple criteria and pagination.
   * @param {Object} params - { title, author, genre, available, availableOnly, page = 0, size = 10, sort = 'title' }
   */
  async searchBooks({ title, author, genre, available, availableOnly, page = 0, size = 10, sort = 'title' } = {}) {
    const isAvailable = available !== undefined 
      ? available 
      : (availableOnly ? true : undefined);

    const params = {
      page,
      size,
      sort,
    };

    if (title && title.trim()) params.title = title.trim();
    if (author && author.trim()) params.author = author.trim();
    if (genre && genre.trim()) params.genre = genre.trim();
    if (typeof isAvailable === 'boolean') params.available = isAvailable;

    const response = await api.get('/books/search', { params });
    return response.data;
  },

  /**
   * Get single book by ID.
   * @param {number|string} id
   */
  async getBookById(id) {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  /**
   * Get single book by ISBN.
   * @param {string} isbn
   */
  async getBookByIsbn(isbn) {
    const response = await api.get(`/books/isbn/${encodeURIComponent(isbn)}`);
    return response.data;
  },

  /**
   * Get book availability status by ID.
   * @param {number|string} id
   */
  async getBookAvailability(id) {
    const response = await api.get(`/books/${id}/availability`);
    return response.data;
  },

  /**
   * Create a new book record (Requires ADMIN or LIBRARIAN role).
   * @param {Object} bookData
   */
  async createBook(bookData) {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  /**
   * Update book metadata and stock (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} id
   * @param {Object} bookData
   */
  async updateBook(id, bookData) {
    const response = await api.put(`/books/${id}`, bookData);
    return response.data;
  },

  /**
   * Soft delete book (Requires ADMIN role).
   * @param {number|string} id
   */
  async deleteBook(id) {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  /**
   * Helper utility to extract clean error message from backend error responses.
   * @param {any} error
   * @returns {string}
   */
  getErrorMessage(error) {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      return error.response.data.errors.map((e) => e.defaultMessage || e).join(', ');
    }
    if (typeof error?.response?.data === 'string' && error.response.data) {
      return error.response.data;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  },
};

export default bookService;
