import api from './axios';

/**
 * Service to handle all Member and User management REST endpoints with error extraction.
 */
export const memberService = {
  /**
   * Fetch paginated list of members.
   * @param {Object} params - { page = 0, size = 10, sort = 'lastName' }
   */
  async getAllMembers({ page = 0, size = 10, sort = 'lastName' } = {}) {
    const response = await api.get('/members', {
      params: { page, size, sort },
    });
    return response.data;
  },

  /**
   * Search members by first or last name with pagination.
   * @param {Object} params - { name, page = 0, size = 10, sort = 'lastName' }
   */
  async searchMembers({ name, page = 0, size = 10, sort = 'lastName' } = {}) {
    const params = { page, size, sort };
    if (name && name.trim()) {
      params.name = name.trim();
    }
    const response = await api.get('/members/search', { params });
    return response.data;
  },

  /**
   * Get single member details by ID.
   * @param {number|string} id
   */
  async getMemberById(id) {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  /**
   * Create a new library member (Requires ADMIN or LIBRARIAN role).
   * @param {Object} memberData - { firstName, lastName, email, membershipDate, password }
   */
  async createMember(memberData) {
    const payload = {
      firstName: memberData.firstName?.trim(),
      lastName: memberData.lastName?.trim(),
      email: memberData.email?.trim(),
      membershipDate: memberData.membershipDate,
      password: memberData.password || 'Member123!',
    };
    const response = await api.post('/members', payload);
    return response.data;
  },

  /**
   * Update existing member details (Requires ADMIN or LIBRARIAN role).
   * @param {number|string} id
   * @param {Object} memberData - { firstName, lastName, email, membershipDate, password? }
   */
  async updateMember(id, memberData) {
    const payload = {
      firstName: memberData.firstName?.trim(),
      lastName: memberData.lastName?.trim(),
      email: memberData.email?.trim(),
      membershipDate: memberData.membershipDate,
    };
    if (memberData.password && memberData.password.trim()) {
      payload.password = memberData.password.trim();
    } else {
      // Backend DTO validation requires password field if not optional
      payload.password = 'Member123!';
    }
    const response = await api.put(`/members/${id}`, payload);
    return response.data;
  },

  /**
   * Soft-delete a member (Requires ADMIN role).
   * @param {number|string} id
   */
  async deleteMember(id) {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },

  /**
   * List system users and their roles (Requires ADMIN role).
   */
  async getAllUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Helper utility to extract user-friendly error messages from backend responses,
   * including duplicate email registration conflicts (409) and validation errors.
   * @param {any} error
   * @returns {string}
   */
  getErrorMessage(error) {
    // Check status code for conflict
    if (error?.response?.status === 409) {
      return error.response.data?.message || 'A member with this email address already exists. Please use a unique email.';
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      return error.response.data.errors
        .map((e) => e.defaultMessage || e.message || (typeof e === 'string' ? e : JSON.stringify(e)))
        .join(', ');
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
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

export default memberService;
