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

  // Upload photo

  uploadPhoto: async photoFile => {
    const url = '/api/profile/upload-photo';
    console.log('Sending photo to:', url);

    try {
      const response = await axiosClient.post(url, photoFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Thêm timeout dài hơn cho việc upload ảnh
        timeout: 30000, // 30 giây
      });

      console.log('Upload photo response:', response.data);
      return response;
    } catch (error) {
      console.error('Error in uploadPhoto API call:', error);
      throw error;
    }
  },
  // Delete account
  deleteAccount: async deleteData => {
    const url = '/api/profile/delete-account';
    return axiosClient.delete(url, {
      data: deleteData,
    });
  },
};

export default profileApi;
