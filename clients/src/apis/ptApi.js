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

  rejectBooking: async bookingId => {
    const url = `/api/pt/bookings/${bookingId}/reject`;
    return axiosClient.post(url);
  },

  markBookingAsCompleted: async bookingId => {
    const url = `/api/pt/bookings/${bookingId}/complete`;
    return axiosClient.post(url);
  },
  getNotifications: async () => {
    try {
      return {data: []};
    } catch (error) {
      console.error('Error getting notifications:', error);
      return {data: []};
    }
  },

  // Set PT Availability APIs
  setAvailability: (data, token) => {
    const url = '/pts/availability';
    return axiosClient.post(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get PT Availability APIs
  getAvailability: (ptId, date) => {
    const url = `/pts/${ptId}/availability/${date}`;
    return axiosClient.get(url);
  },
};

export default ptApi;
