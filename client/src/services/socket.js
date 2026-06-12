import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// Initialize socket instance (do not auto-connect)
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.auth = { userId };
    socket.connect();
    console.log('Socket client connecting...');
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('Socket client disconnected.');
  }
};
