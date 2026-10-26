import axiosClient from './axiosClient';

// The accessToken parameters are kept for backwards compatibility with
// existing callers; the token is attached by axiosClient.
class ChatApi {
  async getChatRooms(_accessToken) {
    const response = await axiosClient.get('/api/chat/rooms');
    return response.data;
  }

  async startChat(_accessToken, otherUserId) {
    const response = await axiosClient.get(`/api/chat/room/${otherUserId}`);
    return response.data;
  }

  async getMessages(_accessToken, chatRoomId) {
    const response = await axiosClient.get(`/api/chat/messages/${chatRoomId}`);
    return response.data;
  }

  async sendMessage(_accessToken, chatRoomId, content) {
    const response = await axiosClient.post(`/api/chat/send/${chatRoomId}`, {content});
    return response.data;
  }
}

export default new ChatApi();
