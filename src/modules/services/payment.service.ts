import { PaymentMethod, PaymentStatus } from "@prisma/client";
import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";
import { StripeService } from "./stripe.service";
import { PayPalService } from "./paypal.service";

export interface PaymentInitResponse {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  checkoutUrl?: string; // For Stripe Checkout Session
  clientSecret?: string; // For Stripe Payment Intent (alternative)
  approvalUrl?: string; // For PayPal
  paymentIntentId?: string; // For Stripe Payment Intent
  sessionId?: string; // For Stripe Checkout Session
  paypalOrderId?: string; // For PayPal
  status: "initialized" | "pending" | "failed";
}

export class PaymentService {
  private stripeService: StripeService;
  private paypalService: PayPalService;

  constructor() {
    this.stripeService = new StripeService();
    this.paypalService = new PayPalService();
  }

  /**
   * Initialize Stripe payment with Checkout Session (Hosted Payment Page)
   */
  async initializeStripePayment(
    orderId: string,
    amount: number,
    items: Array<{ title: string; price: number; quantity: number }>
  ): Promise<PaymentInitResponse> {
    const { checkoutUrl, sessionId } =
      await this.stripeService.createCheckoutSession(orderId, amount, items);

    return {
      orderId,
      paymentMethod: PaymentMethod.STRIPE,
      amount,
      checkoutUrl,
      sessionId,
      status: "initialized",
    };
  }

  /**
   * Initialize PayPal payment
   */
  async initializePayPalPayment(
    orderId: string,
    amount: number
  ): Promise<PaymentInitResponse> {
    const { approvalUrl, paypalOrderId } =
      await this.paypalService.createOrder(orderId, amount);

    return {
      orderId,
      paymentMethod: PaymentMethod.PAYPAL,
      amount,
      approvalUrl,
      paypalOrderId,
      status: "initialized",
    };
  }

  /**
   * Initialize payment based on payment method
   */
  async initializePayment(
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    items: Array<{ title: string; price: number; quantity: number }>
  ): Promise<PaymentInitResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    switch (paymentMethod) {
      case PaymentMethod.STRIPE:
        return this.initializeStripePayment(orderId, amount, items);
      case PaymentMethod.PAYPAL:
        return this.initializePayPalPayment(orderId, amount);
      default:
        throw new AppError("Invalid payment method", 400);
    }
  }

  /**
   * Get Stripe service instance
   */
  getStripeService(): StripeService {
    return this.stripeService;
  }

  /**
   * Get PayPal service instance
   */
  getPayPalService(): PayPalService {
    return this.paypalService;
  }
}

