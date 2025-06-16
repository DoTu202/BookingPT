import axiosClient from './axiosClient';

const ptApi = {
  // PT Management APIs (for PT users)
  // Profile APIs
  getProfile: async () => {
    const url = '/api/pt/profile';
    return axiosClient.get(url);
  },

  updateProfile: async (data) => {
    const url = '/api/pt/profile';
    return axiosClient.put(url, data);
  },

  // Availability APIs
  getAvailabilitySlots: async (params = {}) => {
    const url = '/api/pt/availability';
    return axiosClient.get(url, { params });
  },

  addAvailabilitySlot: async (data) => {
    const url = '/api/pt/availability';
    return axiosClient.post(url, data);
  },

  updateAvailabilitySlot: async (availabilityId, data) => {
    const url = `/api/pt/availability/${availabilityId}`;
    return axiosClient.put(url, data);
  },

  deleteAvailabilitySlot: async (availabilityId) => {
    const url = `/api/pt/availability/${availabilityId}`;
    return axiosClient.delete(url);
  },

  // Booking APIs
  getBookings: async (params = {}) => {
    const url = '/api/pt/bookings';
    return axiosClient.get(url, { params });
  },

  confirmBooking: async (bookingId) => {
    const url = `/api/pt/bookings/${bookingId}/confirm`;
    return axiosClient.post(url);
  },

  rejectBooking: async (bookingId) => {
    const url = `/api/pt/bookings/${bookingId}/reject`;
    return axiosClient.post(url);
  },

  markBookingAsCompleted: async (bookingId) => {
    const url = `/api/pt/bookings/${bookingId}/complete`;
    return axiosClient.post(url);
  },

  // Dashboard/Stats APIs
  getDashboardStats: async () => {
    try {
      const [bookingsResponse, profileResponse] = await Promise.all([
        ptApi.getBookings(),
        ptApi.getProfile()
      ]);

      const bookings = bookingsResponse.data?.data || [];
      const profile = profileResponse.data?.data || {};

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings.filter(booking => 
        booking.date === today && booking.status === 'confirmed'
      ).length;

      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const monthlyEarnings = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.date);
          return bookingDate.getMonth() === thisMonth &&
                 bookingDate.getFullYear() === thisYear &&
                 booking.status === 'completed';
        })
        .reduce((total, booking) => total + (booking.price || 0), 0);

      const uniqueClients = new Set(
        bookings.map(booking => booking.client?._id || booking.clientId)
      ).size;

      const upcomingBookings = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.date);
          const today = new Date();
          return bookingDate >= today && booking.status === 'confirmed';
        })
        .slice(0, 3);

      // Process recent clients
      const clientsMap = {};
      bookings.forEach(booking => {
        const clientId = booking.client?._id || booking.clientId;
        const client = booking.client;
        
        if (clientId && client) {
          if (!clientsMap[clientId]) {
            clientsMap[clientId] = {
              id: clientId,
              name: client.fullName || client.name || 'Unknown Client',
              totalSessions: 0,
              totalSpent: 0,
              lastBookingDate: null,
            };
          }
          
          clientsMap[clientId].totalSessions += 1;
          
          if (booking.status === 'completed') {
            clientsMap[clientId].totalSpent += booking.price || 0;
          }
          
          // Track latest booking
          const bookingDate = new Date(booking.date);
          if (!clientsMap[clientId].lastBookingDate || bookingDate > clientsMap[clientId].lastBookingDate) {
            clientsMap[clientId].lastBookingDate = bookingDate;
          }
        }
      });

      // Get recent clients (sorted by last booking date)
      const recentClients = Object.values(clientsMap)
        .sort((a, b) => (b.lastBookingDate || 0) - (a.lastBookingDate || 0))
        .slice(0, 5);

      return {
        data: {
          todayBookings,
          monthlyEarnings,
          totalClients: uniqueClients,
          rating: profile.rating || 0,
          upcomingBookings,
          recentClients,
          recentActivity: []
        }
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  },

  // Original PT management functions (Legacy - for backward compatibility)
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