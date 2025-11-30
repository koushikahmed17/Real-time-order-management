import { Router, Request, Response } from "express";
import { WebhookController } from "../modules/controllers/webhook.controller";

const router = Router();
const webhookController = new WebhookController();

/**
 * Stripe webhook endpoint
 * Note: This route should NOT use body-parser middleware
 * We need raw body for signature verification
 */
router.post(
  "/stripe",
  // Raw body is handled by middleware in index.ts
  webhookController.handleStripeWebhook
);

/**
 * PayPal webhook endpoint
 * Note: This route should NOT use body-parser middleware
 * We need raw body for signature verification
 */
router.post(
  "/paypal",
  // Raw body is handled by middleware in index.ts
  webhookController.handlePayPalWebhook
);

export default router;


