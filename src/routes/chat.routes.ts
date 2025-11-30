import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "../utils";
import { ChatController } from "../modules/controllers/chat.controller";

const router = Router();
const chatController = new ChatController();

// Chat message validation schema
const chatSchema = {
  body: z.object({
    message: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
  }),
};

// Routes
// Note: Authentication is optional. If you want to save chat history per user,
// you can add the authenticate middleware. Currently works without authentication.
router.post(
  "/",
  validateRequest(chatSchema),
  chatController.chat
);

export default router;

