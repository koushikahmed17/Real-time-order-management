import Stripe from "stripe";
import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { SocketService } from "./socket.service";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeService {
  /**
   * Create Stripe Checkout Session (Hosted Payment Page)
   */
  async createCheckoutSession(
    orderId: string,
    amount: number,
    items: Array<{ title: string; price: number; quantity: number }>
  ): Promise<{
    checkoutUrl: string;
    sessionId: string;
  }> {
    try {
      // Verify order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // Use port 3000 for redirect URLs
      const port = process.env.PORT || 3000;
      const baseUrl = `http://localhost:${port}`;

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.title,
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${baseUrl}/api/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${baseUrl}/api/payment/cancel?order_id=${orderId}`,
        metadata: {
          orderId,
        },
      });

      return {
        checkoutUrl: session.url!,
        sessionId: session.id,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Stripe error: ${error.message}`, 500);
    }
  }

  /**
   * Create Stripe Payment Intent (For frontend integration)
   */
  async createPaymentIntent(orderId: string, amount: number): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      // Verify order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          orderId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Stripe error: ${error.message}`, 500);
    }
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError("STRIPE_WEBHOOK_SECRET is not configured", 500);
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return event;
    } catch (error: any) {
      throw new AppError(`Webhook signature verification failed: ${error.message}`, 400);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    let orderId: string | undefined;

    // Extract orderId from different event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      orderId = session.metadata?.orderId;
    } else if (event.data?.object) {
      const paymentObject = event.data.object as Stripe.PaymentIntent;
      orderId = paymentObject.metadata?.orderId;
    }

    if (!orderId && (event as any).metadata?.orderId) {
      orderId = (event as any).metadata.orderId;
    }

    if (!orderId) {
      throw new AppError("Order ID not found in webhook event", 400);
    }

    switch (event.type) {
      case "payment_intent.succeeded":
      case "checkout.session.completed":
        await this.handlePaymentSuccess(orderId);
        break;

      case "payment_intent.payment_failed":
        await this.handlePaymentFailure(orderId);
        break;

      default:
        // Log unhandled events
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(orderId: string): Promise<void> {
    // Get order to find userId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        totalAmount: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PROCESSING,
      },
    });

    // Emit Socket.IO event to notify user
    try {
      const socketService = new SocketService();
      socketService.emitPaymentSuccess(order.userId, orderId, order.totalAmount);
    } catch (error) {
      console.error("Failed to emit payment success event:", error);
      // Don't throw - webhook should still succeed even if socket fails
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(orderId: string): Promise<void> {
    // Get order to find userId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    // Emit Socket.IO event to notify user
    try {
      const socketService = new SocketService();
      socketService.emitPaymentFailure(order.userId, orderId);
    } catch (error) {
      console.error("Failed to emit payment failure event:", error);
      // Don't throw - webhook should still succeed even if socket fails
    }
  }
}

