import axiosClient from './axiosClient';

const profileApi = {
  // Get profile
  getProfile: async () => {
    const url = '/api/profile/profile';
    return axiosClient.get(url);
  },

  // Update profile
  updateProfile: async profileData => {
    const url = '/api/profile/profile';
    return axiosClient.put(url, profileData);
  },

  // Change password
  changePassword: async passwordData => {
    const url = '/api/profile/change-password';
    return axiosClient.post(url, passwordData);
  },

  // Upload photo (multipart; uploads get a longer timeout)
  uploadPhoto: async photoFile =>
    axiosClient.post('/api/profile/upload-photo', photoFile, {
      headers: {'Content-Type': 'multipart/form-data'},
      timeout: 30000,
    }),

  // Revoke every session, including this one
  logoutAllDevices: async () => axiosClient.post('/api/profile/logout-all'),

  // Push notifications: link / unlink this device's FCM token
  registerPushToken: async ({token, platform}) =>
    axiosClient.post('/api/profile/push-token', {token, platform}),
  unregisterPushToken: async token =>
    axiosClient.delete('/api/profile/push-token', {data: {token}}),

  // Delete account
  deleteAccount: async deleteData => {
    const url = '/api/profile/delete-account';
    return axiosClient.delete(url, {
      data: deleteData,
    });
  },
};

export default profileApi;
