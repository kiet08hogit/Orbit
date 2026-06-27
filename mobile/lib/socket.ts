import Constants from 'expo-constants';
import { io, Socket } from 'socket.io-client';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://127.0.0.1:3000';

let socket: Socket | null = null;

export function connectSocket(token: string | null): Socket {
  if (socket && socket.connected) return socket;
  socket = io(baseURL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
    autoConnect: true,
  });
  socket.on('connect', () => {
    if (token) socket?.emit('authenticate', { token });
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
