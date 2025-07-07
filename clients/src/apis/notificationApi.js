import { appInfo } from '../constants/appInfos';

const notificationApi = {
  getNotifications: async (token, page = 1, limit = 20, isRead = undefined) => {
    try {
      let url = `${appInfo.BASE_URL}/api/notifications?page=${page}&limit=${limit}`;
      if (isRead !== undefined) {
        url += `&isRead=${isRead}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get notifications');
      }

      return data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Get unread notification count
  getUnreadCount: async (token) => {
    try {
      const response = await fetch(`${appInfo.BASE_URL}/api/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get unread count');
      }

      return data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (token, notificationId) => {
    try {
      const response = await fetch(`${appInfo.BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (token) => {
    try {
      const response = await fetch(`${appInfo.BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark all as read');
      }

      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (token, notificationId) => {
    try {
      const response = await fetch(`${appInfo.BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete notification');
      }

      return data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
};

export default notificationApi;