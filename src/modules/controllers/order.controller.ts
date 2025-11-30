import { Request, Response } from "express";
import { asyncHandler } from "../../utils";
import { OrderService } from "../services/order.service";

const orderService = new OrderService();

export class OrderController {
  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await orderService.createOrder(userId, req.body);

    // Initialize payment (creates checkout session/approval URL)
    const paymentInit = await orderService.initializePayment(
      result.id,
      result.paymentMethod,
      result.items
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: result,
        payment: paymentInit,
      },
    });
  });

  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const result = await orderService.updateOrderStatus(id, orderStatus);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        order: result,
      },
    });
  });
}

