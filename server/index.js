const express = require('express');
const cors = require('cors');
const app = express();
const authRouter = require('./src/routers/authRouter');
const connectDB = require('./src/configs/connectDB');
const dotenv = require('dotenv');
const ptRouter = require('./src/routers/ptRouter');
const clientRouter = require('./src/routers/clientRouter');
const notificationRouter = require('./src/routers/notificationRouter');
const chatRouter = require('./src/routers/chatRouter');

dotenv.config();

const PORT = 3001;

app.use(express.json());
app.use(cors());

//api
app.use('/auth', authRouter);
app.use('/api/pt', ptRouter);
app.use('/api/client', clientRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/chat', chatRouter);

connectDB();

app.listen(PORT, '0.0.0.0', err => {
  if (err) {
    console.error('Error starting server:', err);
  } else {
    console.log(`Server is running on:`);
    console.log(`  - Local: http://localhost:${PORT}`);
  }
});
