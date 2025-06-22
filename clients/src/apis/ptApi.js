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
    const url = '/api/pt/dashboard/stats';
    return axiosClient.get(url);
  },

  getTodayBookings: async () => {
    const url = '/api/pt/dashboard/today-bookings';
    return axiosClient.get(url);
  },

  // Earnings APIs
  getEarningsData: async (period = 'monthly') => {
    const url = '/api/pt/earnings';
    return axiosClient.get(url, { params: { period } });
  },

  getRecentClients: async () => {
    try {
      const response = await ptApi.getBookings();
      const bookings = response.data?.data || [];
      
      // Process recent clients
      const clientsMap = {};
      bookings.forEach(booking => {
        const clientId = booking.client?._id || booking.clientId;
        const client = booking.client;
        
        if (clientId && client) {
          if (!clientsMap[clientId]) {
            clientsMap[clientId] = {
              _id: clientId,
              username: client.fullName || client.name || 'Unknown Client',
              totalSessions: 0,
              totalSpent: 0,
              lastSession: null,
            };
          }
          
          clientsMap[clientId].totalSessions += 1;
          
          if (booking.status === 'completed') {
            clientsMap[clientId].totalSpent += booking.price || 0;
          }
          
          // Track latest booking
          const bookingDate = new Date(booking.date);
          if (!clientsMap[clientId].lastSession || bookingDate > new Date(clientsMap[clientId].lastSession)) {
            clientsMap[clientId].lastSession = booking.date;
          }
        }
      });

      // Get recent clients (sorted by last session date)
      const recentClients = Object.values(clientsMap)
        .sort((a, b) => new Date(b.lastSession || 0) - new Date(a.lastSession || 0))
        .slice(0, 5);

      return { data: recentClients };
    } catch (error) {
      console.error('Error getting recent clients:', error);
      return { data: [] };
    }
  },

  getRecentReviews: async () => {
    try {
      // This would typically call a reviews endpoint
      // For now, return empty array as this endpoint may not exist yet
      return { data: [] };
    } catch (error) {
      console.error('Error getting recent reviews:', error);
      return { data: [] };
    }
  },

  getNotifications: async () => {
    try {
      // This would typically call a notifications endpoint
      // For now, return empty array as this endpoint may not exist yet
      return { data: [] };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { data: [] };
    }
  },

  // Earnings APIs
  getEarningsStats: async (period = 'month') => {
    try {
      const response = await ptApi.getBookings();
      const bookings = response.data?.data || [];
      
      const completedBookings = bookings.filter(b => b.status === 'completed');
      
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const periodBookings = completedBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= startDate;
      });
      
      const totalEarnings = periodBookings.reduce((total, booking) => total + (booking.price || 0), 0);
      const totalSessions = periodBookings.length;
      const averagePerSession = totalSessions > 0 ? totalEarnings / totalSessions : 0;
      
      return {
        data: {
          totalEarnings,
          totalSessions,
          averagePerSession,
          period,
          bookings: periodBookings
        }
      };
    } catch (error) {
      console.error('Error getting earnings stats:', error);
      throw error;
    }
  },

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