const express = require('express');
const cors = require('cors');
const app = express();
const authRouter = require('./src/routers/authRouter');
const connectDB = require('./src/configs/connectDB');
const dotenv = require('dotenv');
const ptRouter = require('./src/routers/ptRouter');
const clientRouter = require('./src/routers/clientRouter');

dotenv.config();

const PORT = 3001;

app.use(express.json());
app.use(cors());

//api
app.use('/auth', authRouter);
app.use('/api/pts', ptRouter);
app.use('/api/client', clientRouter);

connectDB();

// Bind to all interfaces for development (needed for iOS Simulator)
// In production, use proper reverse proxy (nginx) with HTTPS
app.listen(PORT, '0.0.0.0', err => {
  if (err) {
    console.error('Error starting server:', err);
  } else {
    console.log(`Server is running on:`);
    console.log(`  - Local: http://localhost:${PORT}`);
    console.log(`  - Network: http://10.255.179.65:${PORT}`);
    console.log(`  ℹ️  For iOS Simulator, use localhost. For real device, use network IP.`);
  }
});
