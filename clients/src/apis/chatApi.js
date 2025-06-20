import axios from 'axios';
import { appInfo } from '../constants/appInfos';

const API_BASE_URL = `${appInfo.BASE_URL}/api/chat`;

class ChatApi {
  async getChatRooms(accessToken) {
    const response = await axios.get(`${API_BASE_URL}/rooms`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async startChat(accessToken, otherUserId) {
    const response = await axios.get(`${API_BASE_URL}/room/${otherUserId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }


  async getMessages(accessToken, chatRoomId) {
    const response = await axios.get(`${API_BASE_URL}/messages/${chatRoomId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async sendMessage(accessToken, chatRoomId, content) {
    const response = await axios.post(
      `${API_BASE_URL}/send/${chatRoomId}`,
      { content },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  }
}

export default new ChatApi();
