const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Flexible CORS configuration for local development and specified CLIENT_URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Allow matching origins or any local dev port (5173-5179)
      const isLocalhostDev = /^http:\/\/(localhost|127\.0\.0\.1):(517[0-9]|3000)$/.test(origin);
      if (allowedOrigins.includes(origin) || isLocalhostDev) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'NoFoodWaste API Server is healthy' });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
