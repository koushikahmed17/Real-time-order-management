import { Request, Response, NextFunction } from "express";

/**
 * Middleware to capture raw body for webhook signature verification
 * Stripe and PayPal require raw body for signature verification
 * Note: This middleware must be applied BEFORE express.json()
 */
export const rawBodyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only process webhook routes
  if (req.path.startsWith("/api/webhooks")) {
    let data = "";

    req.setEncoding("utf8");
    
    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      // Store raw body as Buffer for Stripe signature verification
      (req as any).rawBody = Buffer.from(data, "utf8");
      (req as any).rawBodyString = data;
      
      // Parse JSON for easy access
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
};

