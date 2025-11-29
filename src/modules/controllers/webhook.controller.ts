import { Request, Response } from "express";
import { asyncHandler } from "../../utils";
import { PaymentService } from "../services/payment.service";

const paymentService = new PaymentService();

export class WebhookController {
  /**
   * Handle Stripe webhook
   */
  handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Stripe signature",
      });
    }

    const stripeService = paymentService.getStripeService();

    // Get raw body buffer for signature verification
    // When using express.raw(), req.body is already a Buffer
    const rawBody = Buffer.isBuffer(req.body) 
      ? req.body 
      : Buffer.from(JSON.stringify(req.body), "utf8");

    // Verify webhook signature and get event
    const event = stripeService.verifyWebhookSignature(
      rawBody,
      signature
    );

    // Handle the webhook event
    await stripeService.handleWebhook(event);

    // Return 200 immediately to Stripe
    res.json({ received: true });
  });

  /**
   * Handle PayPal webhook
   */
  handlePayPalWebhook = asyncHandler(async (req: Request, res: Response) => {
    const paypalService = paymentService.getPayPalService();

    // Verify webhook signature
    const isValid = await paypalService.verifyWebhook(
      req.body,
      req.headers
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid PayPal webhook signature",
      });
    }

    // Handle the webhook event
    await paypalService.handleWebhook(req.body);

    // Return 200 immediately to PayPal
    res.json({ received: true });
  });
}

