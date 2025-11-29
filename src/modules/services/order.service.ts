import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";
import { PaymentService } from "./payment.service";
import { SocketService } from "./socket.service";

export interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

export interface CreateOrderData {
  items: OrderItem[];
  paymentMethod: PaymentMethod;
}

export interface OrderResponse {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Calculate total amount from order items
   */
  private calculateTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }

  /**
   * Validate order items
   */
  private validateItems(items: OrderItem[]): void {
    if (!items || items.length === 0) {
      throw new AppError("Order must have at least one item", 400);
    }

    for (const item of items) {
      if (!item.title || typeof item.title !== "string") {
        throw new AppError("Each item must have a valid title", 400);
      }
      if (typeof item.price !== "number" || item.price <= 0) {
        throw new AppError("Each item must have a valid price greater than 0", 400);
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        throw new AppError("Each item must have a valid quantity greater than 0", 400);
      }
    }
  }

  /**
   * Create a new order
   */
  async createOrder(userId: string, data: CreateOrderData): Promise<OrderResponse> {
    // Validate items
    this.validateItems(data.items);

    // Calculate total amount
    const totalAmount = this.calculateTotal(data.items);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        items: data.items as any, // Prisma JSON field
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
      },
    });

    return {
      id: order.id,
      userId: order.userId,
      items: order.items as OrderItem[],
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Initialize payment (calls PaymentService)
   */
  async initializePayment(
    orderId: string,
    paymentMethod: PaymentMethod,
    items: OrderItem[]
  ): Promise<any> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Initialize payment via PaymentService
    return this.paymentService.initializePayment(
      orderId,
      paymentMethod,
      order.totalAmount,
      items
    );
  }

  /**
   * Update order status and emit Socket.IO event
   */
  async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatus,
    updatePaymentStatus?: PaymentStatus
  ): Promise<OrderResponse> {
    // Get order to find userId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus,
        ...(updatePaymentStatus && { paymentStatus: updatePaymentStatus }),
      },
    });

    // Emit Socket.IO event to notify user
    try {
      const socketService = new SocketService();
      socketService.emitOrderStatusChange(order.userId, orderId, orderStatus);
    } catch (error) {
      console.error("Failed to emit order status update event:", error);
      // Don't throw - order update should succeed even if socket fails
    }

    return {
      id: updatedOrder.id,
      userId: updatedOrder.userId,
      items: updatedOrder.items as OrderItem[],
      totalAmount: updatedOrder.totalAmount,
      paymentMethod: updatedOrder.paymentMethod,
      paymentStatus: updatedOrder.paymentStatus,
      orderStatus: updatedOrder.orderStatus,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
    };
  }
}

