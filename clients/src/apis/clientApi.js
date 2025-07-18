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

  cancelBooking: async (bookingId) => {
    const url = `/api/client/my-bookings/${bookingId}/cancel`;
    return axiosClient.post(url);
  },
};

export default clientApi;
