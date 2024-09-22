import { io } from 'socket.io-client';

const webServerBaseUrl = process.env.NODE_ENV === 'production'
  ? process.env.BACKEND_URL
  : 'http://localhost:3001';

const socket = io(webServerBaseUrl, {
  transports: ['websocket'],
  withCredentials: true,
});


export { socket, webServerBaseUrl };
