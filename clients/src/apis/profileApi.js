import axiosClient from './axiosClient';

const profileApi = {
  getProfile: async () => {
    const url = '/api/client/profile';
    return axiosClient.get(url);
  },

  updateProfile: async (profileData) => {
    const url = '/api/client/profile';
    return axiosClient.put(url, profileData);
  },

  changePassword: async (passwordData) => {
    const url = '/api/client/profile/change-password';
    return axiosClient.post(url, passwordData);
  },

  uploadPhoto: async (photoData) => {
    const url = '/api/client/profile/upload-photo';
    return axiosClient.post(url, photoData);
  },

  deleteAccount: async (passwordData) => {
    const url = '/api/client/profile/delete-account';
    return axiosClient.delete(url, { data: passwordData });
  },
};

export default profileApi;
