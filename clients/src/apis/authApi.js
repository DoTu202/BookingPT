import axiosClient from './axiosClient';

class AuthAPI {
  HandleAuthentication = async (url, data, method) => {
    return await axiosClient(`/auth${url}`, {
      method: method || 'get',
      data,
    });
  };
}

const authenticationAPI = new AuthAPI();

export default authenticationAPI;
