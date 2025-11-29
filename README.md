# Order Management API

A robust Express.js REST API built with TypeScript, PostgreSQL, Prisma ORM, and Zod validation.

## Features

- ✅ Express.js with TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ Zod schema validation
- ✅ Central error handling
- ✅ Socket.IO for real-time communication
- ✅ Organized folder structure
- ✅ Type-safe database queries

## Project Structure

```
src/
  ├── routes/           # API route definitions
  ├── modules/          # Business logic modules
  │   ├── controllers/  # Request handlers
  │   └── services/     # Business logic layer
  ├── prisma/           # Prisma schema and client
  ├── middlewares/      # Custom middleware
  ├── socket/           # Socket.IO configuration
  └── utils/            # Utility functions
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp env.example .env
   ```
   Edit `.env` and update the `DATABASE_URL` with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/order_management?schema=public"
   ```

4. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

5. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Example Routes (can be customized)
- `GET /api/examples` - Get all examples
- `GET /api/examples/:id` - Get example by ID
- `POST /api/examples` - Create a new example

## Error Handling

The project includes a centralized error handler that:
- Handles Zod validation errors
- Handles Prisma database errors
- Handles custom application errors
- Returns consistent error response format

## Validation

Use Zod schemas with the `validateRequest` middleware:

```typescript
import { z } from 'zod';
import { validateRequest } from '../utils';

const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
  }),
};

router.post('/', validateRequest(createUserSchema), controller.createUser);
```

## Database

Prisma is used as the ORM. To modify the database schema:

1. Edit `src/prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Prisma Client will be automatically regenerated

## Socket.IO

Socket.IO is configured for real-time communication. Customize events in `src/socket/index.ts`.

## License

ISC

