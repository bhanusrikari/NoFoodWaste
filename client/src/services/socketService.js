import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
// Extract root server URL (e.g. http://localhost:5001)
const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket = null;

export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const joinTrackingRoom = (requestId) => {
  if (socket) {
    socket.emit('join:delivery_tracking', { requestId });
  }
};

export const subscribeLocationUpdates = (callback) => {
  if (socket) {
    socket.on('delivery:location:update', callback);
  }
};

export const unsubscribeLocationUpdates = (callback) => {
  if (socket) {
    socket.off('delivery:location:update', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
