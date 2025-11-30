import { Request, Response } from "express";
import { asyncHandler } from "../../utils";
import { ChatService } from "../services/chat.service";

const chatService = new ChatService();

export class ChatController {
  chat = asyncHandler(async (req: Request, res: Response) => {
    const { message } = req.body;
    const userId = req.user?.id; // Optional: user ID from authentication

    const result = await chatService.processMessage({
      message,
      userId,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

