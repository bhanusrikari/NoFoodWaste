const { Server } = require('socket.io');
const { verifyToken } = require('./modules/auth/auth.utils');
const authService = require('./modules/auth/auth.service');
const FoodRequest = require('./modules/foodRequests/foodRequest.model');

let ioInstance = null;

const initSocket = (server) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  ioInstance = new Server(server, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
      credentials: true,
    },
  });

  // Socket.IO Middleware for Authentication
  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyToken(token);
      const user = await authService.getUserById(decoded.userId);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected client: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);

    // Customer joins request-specific tracking room after ownership verification
    socket.on('join:delivery_tracking', async ({ requestId }) => {
      try {
        if (!requestId) {
          return socket.emit('tracking:error', { message: 'Request ID is required' });
        }

        const request = await FoodRequest.findById(requestId);
        if (!request) {
          return socket.emit('tracking:error', { message: 'Food request not found' });
        }

        // Ownership Security Check: Only the request customer (or admin) can join tracking room
        if (request.customer.toString() !== socket.user.id.toString() && socket.user.role !== 'ADMIN') {
          return socket.emit('tracking:error', { message: 'Unauthorized access to tracking room' });
        }

        const roomName = `delivery:${requestId}`;
        socket.join(roomName);
        console.log(`[Socket.IO] User ${socket.user.id} joined room ${roomName}`);

        socket.emit('tracking:joined', {
          success: true,
          requestId,
          room: roomName,
        });
      } catch (err) {
        socket.emit('tracking:error', { message: 'Failed to join tracking room' });
      }
    });

    // Handle Location Updates (published by authorized delivery driver/volunteer/admin)
    socket.on('delivery:location:update', async ({ requestId, latitude, longitude, timestamp }) => {
      try {
        // SECURITY CHECK: Customers are READ-ONLY consumers and CANNOT publish location updates
        if (socket.user.role === 'CUSTOMER') {
          return socket.emit('tracking:error', {
            message: 'Forbidden: CUSTOMER clients cannot publish delivery location updates',
          });
        }

        // Integration Guard: Only authorized publisher roles (VOLUNTEER, ADMIN) are permitted to update vehicle location
        if (!['VOLUNTEER', 'ADMIN'].includes(socket.user.role)) {
          return socket.emit('tracking:error', {
            message: 'Forbidden: Unauthorized role for location publishing',
          });
        }

        if (!requestId || latitude === undefined || longitude === undefined) {
          return socket.emit('tracking:error', { message: 'Invalid location update payload' });
        }

        const roomName = `delivery:${requestId}`;
        const updatedAt = timestamp ? new Date(timestamp) : new Date();

        // Update database currentLocation asynchronously
        await FoodRequest.findByIdAndUpdate(requestId, {
          currentLocation: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            updatedAt,
          },
        });

        // Broadcast to subscribers in room delivery:<requestId>
        ioInstance.to(roomName).emit('delivery:location:update', {
          requestId,
          latitude: Number(latitude),
          longitude: Number(longitude),
          timestamp: updatedAt,
        });
      } catch (err) {
        console.error('[Socket.IO] Error handling location update:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected client: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized!');
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};
