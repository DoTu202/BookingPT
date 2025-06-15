import axiosClient from './axiosClient';

const ptApi = {
  // Original PT management functions
  setAvailability: (data, token) => {
    const url = '/pts/availability';
    return axiosClient.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getAvailability: (ptId, date) => {
    const url = `/pts/${ptId}/availability/${date}`;
    return axiosClient.get(url);
  },

  // Client functions to view PT information
  searchPTs: async (params = {}) => {
    const url = '/api/client/trainers';
    return axiosClient.get(url, { params });
  },

  getPTProfile: async (ptId) => {
    const url = `/api/client/pt/${ptId}/profile`;
    return axiosClient.get(url);
  },

  getPTAvailability: async (ptId, params = {}) => {
    const url = `/api/client/pt/${ptId}/availability`;
    return axiosClient.get(url, { params });
  },

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

export default ptApi;