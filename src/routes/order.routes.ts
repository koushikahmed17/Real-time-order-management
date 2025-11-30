import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "../utils";
import { authenticate, authorize } from "../middlewares";
import { OrderController } from "../modules/controllers/order.controller";

const router = Router();
const orderController = new OrderController();

// Payment method enum for Zod validation
const PaymentMethodEnum = z.enum(["STRIPE", "PAYPAL"]);

// Order status enum for Zod validation
const OrderStatusEnum = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"]);

// Order item schema
const orderItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z.number().positive("Price must be greater than 0"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

// Create order validation schema
const createOrderSchema = {
  body: z.object({
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
    paymentMethod: PaymentMethodEnum,
  }),
};

// Update order status validation schema
const updateOrderStatusSchema = {
  params: z.object({
    id: z.string().uuid("Invalid order ID format"),
  }),
  body: z.object({
    orderStatus: OrderStatusEnum,
  }),
};

// Routes
router.post(
  "/",
  authenticate,
  validateRequest(createOrderSchema),
  orderController.createOrder
);

// Admin only route: Update order status
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

export default router;


