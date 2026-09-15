let socket = null;

export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

    // Optional socket.io-client connection if available at runtime
    if (typeof window !== 'undefined' && window.io) {
      socket = window.io(SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });
    }
  } catch (err) {
    console.warn('Socket connection fallback:', err.message);
  }

  return socket;
};

export const joinTrackingRoom = (requestId) => {
  if (socket && typeof socket.emit === 'function') {
    socket.emit('join:delivery_tracking', { requestId });
  }
};

export const subscribeLocationUpdates = (callback) => {
  if (socket && typeof socket.on === 'function') {
    socket.on('delivery:location:update', callback);
  }
};

export const unsubscribeLocationUpdates = (callback) => {
  if (socket && typeof socket.off === 'function') {
    socket.off('delivery:location:update', callback);
  }
};

export const disconnectSocket = () => {
  if (socket && typeof socket.disconnect === 'function') {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
