import axiosClient from './axiosClient';

const clientApi = {
  // PT Search and Information
  searchPTs: async (params = {}, config = {}) => {
    const url = '/api/client/pt';
    return axiosClient.get(url, { params, ...config });
  },

  getPTProfile: async (ptId) => {
    const url = `/api/client/pt/${ptId}/profile`;
    return axiosClient.get(url);
  },

  getPTReviews: async (ptId, params = {}) => {
    const url = `/api/client/pt/${ptId}/reviews`;
    return axiosClient.get(url, { params });
  },

  getPTAvailability: async (ptId, params = {}) => {
    const url = `/api/client/pt/${ptId}/availability`;
    return axiosClient.get(url, { params });
  },

  // Booking Management
  createBooking: async (bookingData) => {
    const url = '/api/client/bookings';
    return axiosClient.post(url, bookingData);
  },

  getMyBookings: async (params = {}) => {
    const url = '/api/client/my-bookings';
    return axiosClient.get(url, { params });
  },

  createReview: async (bookingId, data) => {
    const url = `/api/client/my-bookings/${bookingId}/review`;
    return axiosClient.post(url, data);
  },

  cancelBooking: async (bookingId, reason) => {
    const url = `/api/client/my-bookings/${bookingId}/cancel`;
    return axiosClient.post(url, { reason });
  },
};

export default clientApi;
