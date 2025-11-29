import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { socketAuth } from './middleware';

// Load environment variables
dotenv.config();

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

const SOCKET_PORT = process.env.SOCKET_PORT || 3001;

// Create HTTP server for Socket.IO
const httpServer = createServer();

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Create a namespace for server-to-server communication (Express server)
const serverNamespace = io.of('/server');

// Server namespace doesn't require authentication
serverNamespace.on('connection', (socket: Socket) => {
  console.log(`🔗 Express server connected to Socket.IO: ${socket.id}`);

  // Handle orderUpdate events from Express server
  socket.on('orderUpdate', (data: any) => {
    const { userId, ...orderData } = data;
    
    // Broadcast to the specific user room in the main namespace
    if (userId) {
      io.to(userId).emit('orderUpdate', orderData);
      console.log(`📦 Forwarded order update to user ${userId}:`, orderData);
    } else {
      console.warn('⚠️ orderUpdate event received without userId:', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Express server disconnected from Socket.IO: ${socket.id}`);
  });
});

// Apply authentication middleware for client connections (main namespace)
io.use(socketAuth);

// Handle client connections (users connecting from frontend)
io.on('connection', (socket: Socket) => {
  const user = socket.data.user;

  if (!user) {
    console.log('Unauthorized connection attempt:', socket.id);
    socket.disconnect();
    return;
  }

  // Join user to their own room (userId) for targeted updates
  socket.join(user.id);

  console.log(`✅ Socket.IO Client connected: ${socket.id} | User: ${user.email} (${user.id})`);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Socket.IO Client disconnected: ${socket.id} | User: ${user.email}`);
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

// Start Socket.IO server
httpServer.listen(SOCKET_PORT, () => {
  console.log(`📡 Socket.IO server is running on port ${SOCKET_PORT}`);
  console.log(`🔗 Connect to: http://localhost:${SOCKET_PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export io instance for internal use (if needed)
export { io };

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing Socket.IO server');
  httpServer.close(() => {
    console.log('Socket.IO server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing Socket.IO server');
  httpServer.close(() => {
    console.log('Socket.IO server closed');
  });
});

