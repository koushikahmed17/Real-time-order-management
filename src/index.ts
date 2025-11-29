import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import routes from "./routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorHandler } from "./utils/errorHandler";
import { notFoundHandler } from "./middlewares";
import { initializeSocket } from "./socket";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const server = createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));

// Raw body for webhook routes only (before other parsers)
app.use("/api/webhooks", express.raw({ type: "application/json" }));

// Webhook routes (must be before JSON parser)
app.use("/api/webhooks", webhookRoutes);

// JSON parser for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Other routes
app.use("/api", routes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

