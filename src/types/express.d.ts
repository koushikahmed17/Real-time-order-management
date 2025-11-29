import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      // Add custom properties to Request object here
      // Example: user?: User;
    }
  }
}

export {};

