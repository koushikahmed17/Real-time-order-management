import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import prisma from "../prisma/client";

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from query params and attaches user to socket
 */
export const socketAuth = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Get token from query params
    const token = socket.handshake.query.token as string;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify access token
    const decoded = verifyAccessToken(token) as TokenPayload;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user info to socket data
    socket.data.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error: any) {
    next(new Error(error.message || "Authentication failed"));
  }
};


