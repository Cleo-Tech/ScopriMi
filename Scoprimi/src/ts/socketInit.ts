import { io } from 'socket.io-client';

const webServerBaseUrl = process.env.NODE_ENV === 'production'
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3001';

const socket = io(webServerBaseUrl, {
  transports: ['websocket'],
  withCredentials: true,
});


export { socket, webServerBaseUrl };