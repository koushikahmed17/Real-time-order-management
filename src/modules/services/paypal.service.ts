import paypal from "@paypal/checkout-server-sdk";
import prisma from "../../prisma/client";
import { AppError } from "../../utils/errorHandler";
import { PaymentStatus, OrderStatus } from "@prisma/client";

// PayPal environment setup
function paypalEnvironment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not defined in environment variables");
  }

  if (mode === "live") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }

  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

// PayPal client
function paypalClient() {
  return new paypal.core.PayPalHttpClient(paypalEnvironment());
}

export class PayPalService {
  /**
   * Create PayPal Order
   */
  async createOrder(orderId: string, amount: number): Promise<{
    approvalUrl: string;
    paypalOrderId: string;
  }> {
    try {
      // Verify order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Order Management",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `http://localhost:${process.env.PORT || 3000}/api/payment/success?orderId=${orderId}`,
          cancel_url: `http://localhost:${process.env.PORT || 3000}/api/payment/cancel?orderId=${orderId}`,
        },
      });

      const client = paypalClient();
      const response = await client.execute(request);

      if (response.statusCode !== 201) {
        throw new AppError("Failed to create PayPal order", 500);
      }

      const paypalOrder = response.result;
      const approvalUrl = paypalOrder.links?.find(
        (link: any) => link.rel === "approve"
      )?.href;

      if (!approvalUrl) {
        throw new AppError("Failed to get PayPal approval URL", 500);
      }

      // Store PayPal order ID in order metadata (you might want to add this field)
      return {
        approvalUrl,
        paypalOrderId: paypalOrder.id!,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`PayPal error: ${error.message}`, 500);
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhook(body: any, headers: any): Promise<boolean> {
    // PayPal webhook verification
    // Note: PayPal webhook verification requires additional setup
    // This is a simplified version - you should implement proper verification
    // based on PayPal's webhook verification documentation

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      console.warn("PAYPAL_WEBHOOK_ID is not configured. Webhook verification skipped.");
      return true; // Return true for development, implement proper verification for production
    }

    // TODO: Implement proper PayPal webhook verification
    // PayPal webhook verification requires:
    // 1. Verifying the webhook signature
    // 2. Validating the webhook event structure
    // 3. Checking webhook ID matches

    return true; // Placeholder - implement proper verification
  }

  /**
   * Handle PayPal webhook events
   */
  async handleWebhook(event: any): Promise<void> {
    const eventType = event.event_type;
    const resource = event.resource;

    // PayPal webhook structure can vary, try multiple ways to get order ID
    let orderId: string | undefined;

    // Try to get from resource purchase_units
    if (resource?.purchase_units?.[0]?.reference_id) {
      orderId = resource.purchase_units[0].reference_id;
    }

    // Try to get from custom_id
    if (!orderId && resource?.purchase_units?.[0]?.custom_id) {
      orderId = resource.purchase_units[0].custom_id;
    }

    // Try to get from invoice_id or metadata
    if (!orderId && resource?.invoice_id) {
      orderId = resource.invoice_id;
    }

    if (!orderId) {
      throw new AppError("Order ID not found in PayPal webhook event", 400);
    }

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await this.handlePaymentSuccess(orderId);
        break;

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
        await this.handlePaymentFailure(orderId);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(orderId: string): Promise<void> {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PROCESSING,
      },
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(orderId: string): Promise<void> {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  }
}

