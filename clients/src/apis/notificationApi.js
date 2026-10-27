import axiosClient from './axiosClient';

// The token parameters are kept for backwards compatibility with existing
// callers; the token is attached by axiosClient.
const notificationApi = {
  getNotifications: async (_token, page = 1, limit = 20, isRead = undefined) => {
    const response = await axiosClient.get('/api/notifications', {
      params: {page, limit, isRead},
    });
    return response.data;
  },

  getUnreadCount: async _token => {
    const response = await axiosClient.get('/api/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (_token, notificationId) => {
    const response = await axiosClient.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async _token => {
    const response = await axiosClient.put('/api/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (_token, notificationId) => {
    const response = await axiosClient.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationApi;
