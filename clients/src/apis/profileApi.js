import axiosClient from './axiosClient';

const profileApi = {
  // Get current user profile
  getProfile: async () => {
    const url = '/api/client/profile';
    return axiosClient.get(url);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const url = '/api/client/profile';
    return axiosClient.put(url, profileData);
  },

  // Change password
  changePassword: async (passwordData) => {
    const url = '/api/client/profile/change-password';
    return axiosClient.post(url, passwordData);
  },

  // Upload profile photo
  uploadPhoto: async (photoData) => {
    const url = '/api/client/profile/upload-photo';
    return axiosClient.post(url, photoData);
  },

  // Delete account
  deleteAccount: async (passwordData) => {
    const url = '/api/client/profile/delete-account';
    return axiosClient.delete(url, { data: passwordData });
  },
};

export default profileApi;
