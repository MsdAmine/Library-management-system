import api from './axios';

/**
 * Service to handle all Borrowing & Circulation REST endpoints with error extraction.
 */
export const borrowingService = {
  /**
   * Fetch paginated list of all borrowing records.
   * @param {Object} params - { page = 0, size = 10, sort = 'borrowDate,desc' }
   */
  async getAllBorrowings({ page = 0, size = 10, sort = 'borrowDate,desc' } = {}) {
    const response = await api.get('/borrowings', {
      params: { page, size, sort },
    });
    return response.data;
  },

  /**
   * Fetch paginated borrowing history for a specific member.
   * @param {number|string} memberId
   * @param {Object} params - { page = 0, size = 10, sort = 'borrowDate,desc' }
   */
  async getMemberHistory(memberId, { page = 0, size = 10, sort = 'borrowDate,desc' } = {}) {
    const response = await api.get(`/borrowings/member/${memberId}`, {
      params: { page, size, sort },
    });
    return response.data;
  },

  /**
   * Fetch list of active (unreturned) borrowing records for a specific member.
   * @param {number|string} memberId
   */
  async getMemberActiveBorrowings(memberId) {
    const response = await api.get(`/borrowings/member/${memberId}/active`);
    return response.data;
  },

  /**
   * Checkout/borrow a book for a member (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} memberId
   * @param {number|string} bookId
   */
  async borrowBook(memberId, bookId) {
    const response = await api.post('/borrowings/borrow', null, {
      params: { memberId, bookId },
    });
    return response.data;
  },

  /**
   * Process a book return and calculate overdue fines (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} recordId
   */
  async returnBook(recordId) {
    const response = await api.post(`/borrowings/return/${recordId}`);
    return response.data;
  },

  /**
   * Soft-archive returned records older than retention period (Requires ADMIN role).
   * @param {number} retentionDays - default 90
   */
  async archiveRecords(retentionDays = 90) {
    const response = await api.post('/borrowings/archive', null, {
      params: { retentionDays },
    });
    return response.data;
  },

  /**
   * Get all archived loan records (Requires ADMIN role).
   */
  async getArchivedRecords() {
    const response = await api.get('/borrowings/archived');
    return response.data;
  },

  /**
   * Helper utility to extract clean, contextual error messages from backend responses.
   * @param {any} error
   * @returns {string}
   */
  getErrorMessage(error) {
    const backendMessage = error?.response?.data?.message || error?.response?.data?.error;

    if (backendMessage) {
      if (backendMessage.toLowerCase().includes('maximum allowed borrowed books limit') || 
          backendMessage.toLowerCase().includes('borrowing limit exceeded')) {
        return 'Borrowing Limit Exceeded: This member has reached the maximum quota of 5 active loans.';
      }
      if (backendMessage.toLowerCase().includes('no copies available') || 
          backendMessage.toLowerCase().includes('not available')) {
        return 'Out of Stock: No available copies remain for this book.';
      }
      if (backendMessage.toLowerCase().includes('already been returned')) {
        return 'Invalid Return: This borrowing record has already been returned.';
      }
      return backendMessage;
    }

    if (error?.response?.status === 403) {
      return 'Permission Denied: You do not have sufficient privileges to perform this circulation action.';
    }

    if (error?.response?.status === 404) {
      return 'Resource Not Found: The requested book, member, or loan record was not found.';
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred while processing the loan transaction.';
  },
};

export default borrowingService;
