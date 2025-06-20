const axios = require('axios');

// Test Chat API
const testChatAPI = async () => {
  const API_BASE = 'http://localhost:3001/api';
  
  try {
    console.log('🚀 Testing Chat API...\n');

    // 1. Login để lấy token
    console.log('1. Login as PT...');
    const ptLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'trainer1@example.com',
      password: 'password123'
    });
    
    const ptToken = ptLoginResponse.data.accesstoken;
    console.log('✅ PT Login successful');

    console.log('2. Login as Client...');
    const clientLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'client1@example.com', 
      password: 'password123'
    });
    
    const clientToken = clientLoginResponse.data.accesstoken;
    console.log('✅ Client Login successful\n');

    // 2. Test get chat rooms (PT)
    console.log('3. Get PT chat rooms...');
    const ptChatRooms = await axios.get(`${API_BASE}/chat/rooms`, {
      headers: { Authorization: `Bearer ${ptToken}` }
    });
    console.log('✅ PT Chat rooms:', ptChatRooms.data.data.length);

    // 3. Test get chat rooms (Client)
    console.log('4. Get Client chat rooms...');
    const clientChatRooms = await axios.get(`${API_BASE}/chat/rooms`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Client Chat rooms:', clientChatRooms.data.data.length);

    // 4. Test start chat (Client to PT)
    console.log('5. Client start chat with PT...');
    const startChatResponse = await axios.get(`${API_BASE}/chat/room/${ptLoginResponse.data.id}`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    
    const chatRoomId = startChatResponse.data.data._id;
    console.log('✅ Chat room created/found:', chatRoomId);

    // 5. Test send message (Client)
    console.log('6. Client send message...');
    const sendMessageResponse = await axios.post(
      `${API_BASE}/chat/send/${chatRoomId}`,
      { content: 'Hello! I would like to book a session with you.' },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );
    console.log('✅ Message sent:', sendMessageResponse.data.data.content);

    // 6. Test send message (PT Reply)
    console.log('7. PT reply message...');
    const replyMessageResponse = await axios.post(
      `${API_BASE}/chat/send/${chatRoomId}`,
      { content: 'Hello! Sure, what time works for you?' },
      { headers: { Authorization: `Bearer ${ptToken}` } }
    );
    console.log('✅ Reply sent:', replyMessageResponse.data.data.content);

    // 7. Test get messages
    console.log('8. Get all messages in chat room...');
    const messagesResponse = await axios.get(`${API_BASE}/chat/messages/${chatRoomId}`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    console.log('✅ Messages retrieved:', messagesResponse.data.data.length);
    
    messagesResponse.data.data.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.content} (${new Date(msg.createdAt).toLocaleTimeString()})`);
    });

    console.log('\n🎉 All Chat API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

testChatAPI();
