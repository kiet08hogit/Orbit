import Constants from 'expo-constants';
import { io, Socket } from 'socket.io-client';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://127.0.0.1:3000';

let socket: Socket | null = null;

/**
 * Connect (or reconnect) with a Clerk session JWT.
 * Mirrors the web client: token goes in handshake auth,
 * then `authenticate` joins the user's room.
 */
export function connectSocket(token: string | null): Socket {
  if (socket && socket.connected) return socket;
  if (socket) {
    socket.auth = token ? { token } : {};
    socket.connect();
    return socket;
  }
  socket = io(baseURL, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
    autoConnect: true,
  });
  socket.on('connect', () => {
    socket?.emit('authenticate');
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
