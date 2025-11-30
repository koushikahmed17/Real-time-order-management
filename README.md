# Order Management API

Express.js REST API with TypeScript, PostgreSQL, Prisma, and real-time updates via Socket.IO.

## Setup Steps

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment file:

   ```bash
   cp env.example .env
   ```

4. Update `.env` file with your credentials

5. Generate Prisma Client:

   ```bash
   npm run prisma:generate
   ```

6. Run database migrations:

   ```bash
   npm run prisma:migrate
   ```

7. Start the server:

   ```bash
   npm run dev
   ```

8. Start Socket.IO server (separate terminal):
   ```bash
   npm run socket:dev
   ```

Server runs on `http://localhost:3000` and Socket.IO on port `3001`.

## Environment Variables

```
# Database

DATABASE_URL="postgresql://postgres:password@localhost:5432/myDatabase?schema=public"

# Server

PORT=3000
NODE_ENV=development

# JWT

JWT_SECRET="your-secret-key-change-this-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Stripe Payment (Dummy Keys)

STRIPE_SECRET_KEY=sk_test_example_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_example_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_example_webhook_secret



# AI Chatbot Configuration

   AI_PROVIDER="groq"
   GROQ_API_KEY="Your api key"

# Socket.IO

CLIENT_URL="http://localhost:3001"
```

## API Endpoints

### Health Check

- `GET /api/health` - Server status

### Authentication

- `POST /api/auth/register` - Register user

  - Body: `{ name, email, password, phone?, address?, role? }`
  - Returns: User data and JWT tokens in cookies

- `POST /api/auth/login` - Login

  - Body: `{ email, password }`
  - Returns: JWT tokens in cookies

- `GET /api/auth/profile` - Get user profile (Protected)
- `POST /api/auth/logout` - Logout

### Orders

- `POST /api/orders` - Create order (Protected)

  - Body: `{ items: [{ title, price, quantity }], paymentMethod: "STRIPE" | "PAYPAL" }`
  - Returns: Order data and payment URL

- `PATCH /api/orders/:id/status` - Update order status (Admin Only)
  - Body: `{ orderStatus: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" }`
  - Emits Socket.IO notification to user

### Payment

- `GET /api/payment/order/:orderId` - Get payment URL for order (Protected)
- `GET /api/payment/success` - Payment success callback
- `GET /api/payment/cancel` - Payment cancellation callback

### Chatbot

- `POST /api/chatbot` - Chat with AI
  - Body: `{ message: "your message" }`
  - Returns: `{ success: true, data: { reply: "..." } }`

### Webhooks

- `POST /api/webhooks/stripe` - Stripe webhook endpoint
- `POST /api/webhooks/paypal` - PayPal webhook endpoint

## Webhook Testing Steps

### Stripe Webhooks

1. Install Stripe CLI:

   ```bash
   stripe login
   ```

2. Forward webhooks to local server:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Copy the webhook signing secret from CLI output and add to `.env`:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. Trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger payment_intent.payment_failed
   ```

### Socket.IO Setup

1. Start Socket.IO server:

   ```bash
   npm run socket:dev
   ```

2. Connect from client:

   ```javascript
   const socket = io("http://localhost:3000", {
     query: { token: "your-jwt-token" },
   });

   socket.on("orderUpdate", (data) => {
     console.log("Order update:", data);
   });
   ```

3. Events:
   - `connected` - Connection confirmation
   - `orderUpdate` - Order status/payment updates

## Database Setup

1. Create PostgreSQL database:

   ```sql
   CREATE DATABASE order_management;
   ```

2. Update `DATABASE_URL` in `.env`:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/databaseName?schema=public"
   ```

3. Run migrations:

   ```bash
   npm run prisma:migrate
   ```

4. Optional - Open Prisma Studio:
   ```bash
   npm run prisma:studio
   ```

## Chatbot Setup

1. Choose AI provider and get API key:

   AI_PROVIDER="groq"
   GROQ_API_KEY="Your Api key"

2. Chatbot saves last 3 messages per user for context (if authenticated)

## Folder Structure

```
src/
  ├── routes/           # API route definitions
  ├── modules/          # Business logic
  │   ├── controllers/  # Request handlers
  │   └── services/     # Business logic layer
  ├── prisma/           # Prisma schema and client
  ├── middlewares/      # Custom middleware
  ├── socket/           # Socket.IO configuration
  └── utils/            # Utility functions
```

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error message"
}
```

Validation errors return:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "path": "fieldName",
      "message": "Error message"
    }
  ]
}
```

## Zod Validation

Request validation using Zod schemas:

```typescript
import { z } from "zod";
import { validateRequest } from "../utils";

const schema = {
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
};

router.post("/", validateRequest(schema), controller.handler);
```

Invalid requests return 400 with validation errors.
