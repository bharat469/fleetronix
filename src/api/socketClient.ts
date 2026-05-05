import { io, Socket } from 'socket.io-client';
import Config from 'react-native-config';

const SOCKET_URL = Config.SOCKET_URL || 'http://103.197.76.50:8087';

class SocketService {
  private static instance: SocketService;
  public socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'], // Faster and more stable for mobile
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] 🟢 Connected to realtime server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] 🔴 Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] ❌ Connection Error:', error.message);
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  public off(event: string) {
    this.socket?.off(event);
  }
}

export default SocketService.getInstance();
