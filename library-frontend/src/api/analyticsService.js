import api from './axios';

/**
 * Default fallback metrics for initial state and error degradation.
 */
export const DEFAULT_ANALYTICS = {
  bookStats: {
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    borrowedCopies: 0,
  },
  borrowingStats: {
    totalLifetimeBorrowings: 0,
    activeBorrowings: 0,
    overdueBorrowings: 0,
    totalFinesCollected: 0.0,
  },
  memberStats: {
    totalMembers: 0,
    activeBorrowers: 0,
  },
  books: {
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    borrowedCopies: 0,
  },
  borrowings: {
    totalBorrowings: 0,
    activeBorrowings: 0,
    overdueBorrowings: 0,
    totalFinesCollected: 0.0,
  },
  members: {
    totalMembers: 0,
    activeMembers: 0,
  },
};

/**
 * Normalizes backend response data whether it uses `books`/`borrowings`/`members`
 * or `bookStats`/`borrowingStats`/`memberStats` naming conventions.
 *
 * @param {Object} raw
 * @returns {Object} Normalized analytics data
 */
export const normalizeAnalyticsData = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ANALYTICS };
  }

  const rawBooks = raw.books || raw.bookStats || {};
  const rawBorrowings = raw.borrowings || raw.borrowingStats || {};
  const rawMembers = raw.members || raw.memberStats || {};

  const totalTitles = Number(rawBooks.totalTitles ?? 0);
  const totalCopies = Number(rawBooks.totalCopies ?? 0);
  const availableCopies = Number(rawBooks.availableCopies ?? 0);
  const borrowedCopies = Number(
    rawBooks.borrowedCopies ?? Math.max(0, totalCopies - availableCopies)
  );

  const totalLifetimeBorrowings = Number(
    rawBorrowings.totalLifetimeBorrowings ?? rawBorrowings.totalBorrowings ?? 0
  );
  const activeBorrowings = Number(rawBorrowings.activeBorrowings ?? 0);
  const overdueBorrowings = Number(rawBorrowings.overdueBorrowings ?? 0);
  const totalFinesCollected = Number(rawBorrowings.totalFinesCollected ?? 0);

  const totalMembers = Number(rawMembers.totalMembers ?? 0);
  const activeBorrowers = Number(
    rawMembers.activeBorrowers ?? rawMembers.activeMembers ?? 0
  );

  const bookStats = {
    totalTitles,
    totalCopies,
    availableCopies,
    borrowedCopies,
  };

  const borrowingStats = {
    totalLifetimeBorrowings,
    activeBorrowings,
    overdueBorrowings,
    totalFinesCollected,
  };

  const memberStats = {
    totalMembers,
    activeBorrowers,
  };

  return {
    bookStats,
    borrowingStats,
    memberStats,
    // Aliases for compatibility
    books: bookStats,
    borrowings: {
      totalBorrowings: totalLifetimeBorrowings,
      totalLifetimeBorrowings,
      activeBorrowings,
      overdueBorrowings,
      totalFinesCollected,
    },
    members: {
      totalMembers,
      activeMembers: activeBorrowers,
      activeBorrowers,
    },
  };
};

/**
 * Service to handle Library Analytics aggregation endpoints.
 */
export const analyticsService = {
  /**
   * Fetch aggregate library metrics.
   * Calls GET /analytics on the REST backend.
   *
   * @returns {Promise<Object>} Normalized LibraryAnalyticsDTO metrics
   */
  async getAnalytics() {
    try {
      const response = await api.get('/analytics');
      return normalizeAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics metrics:', error);
      throw error;
    }
  },

  /**
   * Helper utility to extract clean error message from backend error responses.
   *
   * @param {any} error
   * @returns {string} Human-readable error message
   */
  getErrorMessage(error) {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      return error.response.data.errors
        .map((e) => e.defaultMessage || e)
        .join(', ');
    }
    if (typeof error?.response?.data === 'string' && error.response.data) {
      return error.response.data;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Failed to load library analytics data. Please check your connection.';
  },
};

export default analyticsService;
