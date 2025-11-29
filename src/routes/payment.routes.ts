import { Router } from "express";
import { authenticate } from "../middlewares";
import { PaymentService } from "../modules/services/payment.service";
import { asyncHandler } from "../utils";
import { AppError } from "../utils/errorHandler";
import prisma from "../prisma/client";

const router = Router();
const paymentService = new PaymentService();

/**
 * Get payment URL for an order
 * Returns checkout URL that user can redirect to
 */
router.get(
  "/order/:orderId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user!.id;

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.userId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Get payment URL based on payment method
    if (order.paymentMethod === "STRIPE") {
      const items = order.items as Array<{
        title: string;
        price: number;
        quantity: number;
      }>;

      const paymentInit = await paymentService
        .getStripeService()
        .createCheckoutSession(orderId, order.totalAmount, items);

      return res.json({
        success: true,
        data: {
          checkoutUrl: paymentInit.checkoutUrl,
          orderId,
        },
      });
    } else if (order.paymentMethod === "PAYPAL") {
      const paymentInit = await paymentService.initializePayPalPayment(
        orderId,
        order.totalAmount
      );

      return res.json({
        success: true,
        data: {
          approvalUrl: paymentInit.approvalUrl,
          orderId,
        },
      });
    }

    throw new AppError("Invalid payment method", 400);
  })
);

/**
 * Payment Success Page - Returns JSON response
 */
router.get("/success", asyncHandler(async (req, res) => {
  const { session_id, order_id } = req.query;

  if (!order_id) {
    return res.json({
      success: false,
      message: "Order ID is missing",
    });
  }

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: order_id as string },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    return res.json({
      success: false,
      message: "Order not found",
    });
  }

  return res.json({
    success: true,
    message: "Payment successful!",
    data: {
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        items: order.items,
        createdAt: order.createdAt,
      },
      sessionId: session_id || null,
    },
  });
}));

/**
 * Payment Cancel Page - Returns JSON response
 */
router.get("/cancel", asyncHandler(async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res.json({
      success: false,
      message: "Order ID is missing",
    });
  }

  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: order_id as string },
  });

  if (!order) {
    return res.json({
      success: false,
      message: "Order not found",
    });
  }

  return res.json({
    success: false,
    message: "Payment was cancelled",
    data: {
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
      },
    },
  });
}));

export default router;

