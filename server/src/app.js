const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');

const {CORS_ORIGINS, TRUST_PROXY} = require('./configs/env');
const {UPLOADS_ROOT} = require('./middleware/uploadMiddleware');
const {sanitizeInput} = require('./middleware/sanitizeMiddleware');
const {apiLimiter} = require('./middleware/rateLimitMiddleware');
const {notFound, errorHandler} = require('./middleware/errorMiddleware');

const authRouter = require('./routers/authRouter');
const ptRouter = require('./routers/ptRouter');
const clientRouter = require('./routers/clientRouter');
const notificationRouter = require('./routers/notificationRouter');
const chatRouter = require('./routers/chatRouter');
const profileRouter = require('./routers/profileRouter');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', TRUST_PROXY);

app.use(helmet());
app.use(
  cors({
    // Native mobile clients send no Origin header and are always allowed.
    origin: (origin, callback) =>
      callback(null, !origin || CORS_ORIGINS.includes(origin)),
  }),
);
app.use(express.json({limit: '100kb'}));
app.use(sanitizeInput);

app.get('/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({status: dbReady ? 'ok' : 'degraded'});
});

app.use(
  '/uploads',
  express.static(path.resolve(UPLOADS_ROOT), {
    index: false,
    dotfiles: 'deny',
    setHeaders: res => res.set('X-Content-Type-Options', 'nosniff'),
  }),
);

app.use('/auth', apiLimiter, authRouter);
app.use('/api', apiLimiter);
app.use('/api/pt', ptRouter);
app.use('/api/client', clientRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/chat', chatRouter);
app.use('/api/profile', profileRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
