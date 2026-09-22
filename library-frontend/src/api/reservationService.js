import api from './axios';

/**
 * Service to handle all Book Reservation & Hold Queue REST endpoints with error extraction.
 */
export const reservationService = {
  /**
   * Place a hold on an out-of-stock book.
   * @param {number|string} bookId
   * @param {number|string} [memberId] - Optional (for admin/librarian)
   */
  async placeHold(bookId, memberId) {
    const params = { bookId };
    if (memberId) {
      params.memberId = memberId;
    }
    const response = await api.post('/reservations/hold', null, { params });
    return response.data;
  },

  /**
   * Fetch holds for the authenticated logged-in member.
   */
  async getMyHolds() {
    const response = await api.get('/reservations/my-holds');
    return response.data;
  },

  /**
   * Fetch the active hold queue for a specific book (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} bookId
   */
  async getBookHoldQueue(bookId) {
    const response = await api.get(`/reservations/book/${bookId}`);
    return response.data;
  },

  /**
   * Cancel an active pending hold request.
   * @param {number|string} reservationId
   */
  async cancelHold(reservationId) {
    const response = await api.delete(`/reservations/${reservationId}`);
    return response.data;
  },

  /**
   * Fulfill a specific hold reservation (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} reservationId
   */
  async fulfillReservation(reservationId) {
    const response = await api.post(`/reservations/${reservationId}/fulfill`);
    return response.data;
  },

  /**
   * Fulfill the next queued hold for a book (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} bookId
   */
  async fulfillNextHold(bookId) {
    const response = await api.post(`/reservations/book/${bookId}/fulfill-next`);
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
      if (backendMessage.toLowerCase().includes('already has an active hold') ||
          backendMessage.toLowerCase().includes('already exists')) {
        return 'Hold Already Exists: You already have an active reservation for this book.';
      }
      if (backendMessage.toLowerCase().includes('available for direct borrowing') ||
          backendMessage.toLowerCase().includes('cannot place hold')) {
        return 'Hold Not Allowed: Copies are currently available in stock for direct borrowing.';
      }
      if (backendMessage.toLowerCase().includes('permission') || error?.response?.status === 403) {
        return 'Permission Denied: You do not have permission to manage this reservation.';
      }
      if (backendMessage.toLowerCase().includes('not found') || error?.response?.status === 404) {
        return 'Resource Not Found: The requested reservation, member, or book was not found.';
      }
      return backendMessage;
    }

    if (error?.response?.status === 403) {
      return 'Permission Denied: You do not have sufficient privileges for this reservation action.';
    }

    if (error?.response?.status === 404) {
      return 'Resource Not Found: The requested reservation was not found.';
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred while processing the reservation.';
  },
};

export default reservationService;
