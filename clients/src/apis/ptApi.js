import axiosClient from './axiosClient';

// PT Management APIs (for PT users)
const ptApi = {
  // Profile APIs for PT
  getProfile: async () => {
    const url = '/api/pt/profile';
    return axiosClient.get(url);
  },

  // Update PT Profile
  updateProfile: async data => {
    const url = '/api/pt/profile';
    return axiosClient.put(url, data);
  },

  // Reviews written about the signed-in PT
  getMyReviews: async (params = {}) => {
    const url = '/api/pt/reviews';
    return axiosClient.get(url, {params});
  },

  // Dashboard statistics: {period: 'week'|'month'|'year', offset: 0 = current}
  getDashboard: async (params = {}) => axiosClient.get('/api/pt/dashboard', {params}),

  // Availability APIs
  getAvailabilitySlots: async (params = {}) => {
    const url = '/api/pt/availability';
    return axiosClient.get(url, {params});
  },

  // Add, update, delete availability slots APIs
  addAvailabilitySlot: async data => {
    const url = '/api/pt/availability';
    return axiosClient.post(url, data);
  },

  updateAvailabilitySlot: async (availabilityId, data) => {
    const url = `/api/pt/availability/${availabilityId}`;
    return axiosClient.put(url, data);
  },

  deleteAvailabilitySlot: async availabilityId => {
    const url = `/api/pt/availability/${availabilityId}`;
    return axiosClient.delete(url);
  },

  // Booking APIs
  getBookings: async (params = {}) => {
    const url = '/api/pt/bookings';
    return axiosClient.get(url, {params});
  },

  confirmBooking: async bookingId => {
    const url = `/api/pt/bookings/${bookingId}/confirm`;
    return axiosClient.post(url);
  },

  // `reason` is optional for rejecting a request...
  rejectBooking: async (bookingId, reason) => {
    const url = `/api/pt/bookings/${bookingId}/reject`;
    return axiosClient.post(url, {reason});
  },

  // ...and required for cancelling a confirmed session.
  cancelBooking: async (bookingId, reason) => {
    const url = `/api/pt/bookings/${bookingId}/cancel`;
    return axiosClient.post(url, {reason});
  },

  markBookingAsCompleted: async bookingId => {
    const url = `/api/pt/bookings/${bookingId}/complete`;
    return axiosClient.post(url);
  },
};

export default ptApi;
