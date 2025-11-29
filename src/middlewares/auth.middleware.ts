import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/errorHandler";
import prisma from "../prisma/client";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get access token from cookie or Authorization header
    let token: string | undefined = req.cookies?.accessToken;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace("Bearer ", "");
    }

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    // Verify access token
    const decoded = verifyAccessToken(token) as TokenPayload;

    // Optionally verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError("Invalid or expired access token", 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};

