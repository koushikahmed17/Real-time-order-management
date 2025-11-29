import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { socketAuth } from './middleware';

let io: Server;

// Extend Socket interface to include user data
declare module 'socket.io' {
  interface Socket {
    data: {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    };
  }
}

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    if (!user) {
      console.log('Unauthorized connection attempt:', socket.id);
      socket.disconnect();
      return;
    }

    // Join user to their own room (userId) for targeted updates
    socket.join(user.id);

    console.log(`✅ Client connected: ${socket.id} | User: ${user.email} (${user.id})`);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id} | User: ${user.email}`);
    });

    // Optional: Handle custom events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to order updates',
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

