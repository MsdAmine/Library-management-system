import api from './axios';

/**
 * Service to handle all Fine Management & Payment Ledger REST endpoints with error extraction.
 */
export const fineService = {
  /**
   * Fetch fines for the authenticated logged-in member.
   */
  async getMyFines() {
    const response = await api.get('/fines/my-fines');
    return response.data;
  },

  /**
   * Fetch fines for a specific member by ID (Requires ADMIN, LIBRARIAN, or owner).
   * @param {number|string} memberId
   */
  async getMemberFines(memberId) {
    const response = await api.get(`/fines/member/${memberId}`);
    return response.data;
  },

  /**
   * Fetch all library fines across all members (Requires ADMIN or LIBRARIAN role).
   */
  async getAllFines() {
    const response = await api.get('/fines');
    return response.data;
  },

  /**
   * Settle a pending fine payment.
   * @param {number|string} fineId
   * @param {string} [paymentReference]
   */
  async payFine(fineId, paymentReference) {
    const payload = paymentReference ? { paymentReference } : {};
    const response = await api.post(`/fines/${fineId}/pay`, payload);
    return response.data;
  },

  /**
   * Waive a fine (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} fineId
   * @param {string} [notes]
   */
  async waiveFine(fineId, notes) {
    const payload = notes ? { notes } : {};
    const response = await api.post(`/fines/${fineId}/waive`, payload);
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
      if (backendMessage.toLowerCase().includes('exceeding the allowed limit') ||
          backendMessage.toLowerCase().includes('outstanding pending fines')) {
        return 'Fine Limit Exceeded: You have outstanding fines exceeding $10.00. Please settle your fines before borrowing books.';
      }
      if (backendMessage.toLowerCase().includes('already settled')) {
        return 'Fine Already Settled: This fine has already been paid or waived.';
      }
      if (backendMessage.toLowerCase().includes('permission') || error?.response?.status === 403) {
        return 'Permission Denied: You do not have permission to perform this fine operation.';
      }
      if (backendMessage.toLowerCase().includes('not found') || error?.response?.status === 404) {
        return 'Resource Not Found: The requested fine or member was not found.';
      }
      return backendMessage;
    }

    if (error?.response?.status === 403) {
      return 'Permission Denied: You do not have sufficient privileges for this fine action.';
    }

    if (error?.response?.status === 404) {
      return 'Resource Not Found: The requested fine record was not found.';
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred while processing the fine.';
  },
};

export default fineService;
