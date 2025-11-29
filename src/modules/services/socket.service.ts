import { io as socketClient, Socket } from 'socket.io-client';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface OrderUpdatePayload {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  message?: string;
}

// Socket.IO client connection to the separate Socket.IO server
// Connect to /server namespace for server-to-server communication
let socketConnection: Socket | null = null;
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
const SOCKET_URL = `http://localhost:${SOCKET_PORT}/server`;

/**
 * Get or create Socket.IO client connection to server namespace
 */
function getSocketConnection(): Socket {
  if (!socketConnection || !socketConnection.connected) {
    socketConnection = socketClient(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketConnection.on('connect', () => {
      console.log(`✅ Express server connected to Socket.IO server at ${SOCKET_URL}`);
    });

    socketConnection.on('disconnect', () => {
      console.log(`❌ Express server disconnected from Socket.IO server`);
    });

    socketConnection.on('connect_error', (error) => {
      console.error(`❌ Socket.IO connection error:`, error.message);
      console.error(`   Make sure Socket.IO server is running on port ${SOCKET_PORT}`);
      console.error(`   Run: npm run socket:dev`);
    });
  }

  return socketConnection;
}

export class SocketService {
  /**
   * Emit order update to specific user on the Socket.IO server
   */
  emitOrderUpdate(userId: string, payload: OrderUpdatePayload): void {
    try {
      const socket = getSocketConnection();

      if (!socket.connected) {
        console.warn('⚠️ Socket.IO server not connected. Attempting to connect...');
        return;
      }

      // Emit event to the Socket.IO server
      // The server will then broadcast to the specific user room
      socket.emit('orderUpdate', {
        userId,
        orderId: payload.orderId,
        status: payload.status || payload.orderStatus,
        paymentStatus: payload.paymentStatus,
        orderStatus: payload.orderStatus,
        message: payload.message,
        timestamp: new Date().toISOString(),
      });

      console.log(`📡 Emitted order update to Socket.IO server for user ${userId}:`, payload);
    } catch (error) {
      console.error('Error emitting order update:', error);
    }
  }

  /**
   * Emit payment success notification
   */
  emitPaymentSuccess(userId: string, orderId: string, amount: number): void {
    this.emitOrderUpdate(userId, {
      orderId,
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.PROCESSING,
      message: 'Payment successful! Your order is now processing.',
    });
  }

  /**
   * Emit payment failure notification
   */
  emitPaymentFailure(userId: string, orderId: string): void {
    this.emitOrderUpdate(userId, {
      orderId,
      paymentStatus: PaymentStatus.FAILED,
      message: 'Payment failed. Please try again.',
    });
  }

  /**
   * Emit order status change notification
   */
  emitOrderStatusChange(
    userId: string,
    orderId: string,
    orderStatus: OrderStatus
  ): void {
    const statusMessages: Record<OrderStatus, string> = {
      PENDING: 'Your order is pending.',
      PROCESSING: 'Your order is being processed.',
      SHIPPED: 'Your order has been shipped!',
      DELIVERED: 'Your order has been delivered!',
    };

    this.emitOrderUpdate(userId, {
      orderId,
      orderStatus,
      message: statusMessages[orderStatus] || 'Order status updated.',
    });
  }
}
