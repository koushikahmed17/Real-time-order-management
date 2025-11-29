# Order Management API

A robust Express.js REST API built with TypeScript, PostgreSQL, Prisma ORM, and Zod validation.

## Features

- ✅ Express.js with TypeScript
- ✅ PostgreSQL database with Prisma ORM
- ✅ Zod schema validation
- ✅ Central error handling
- ✅ JWT authentication with bcrypt password hashing
- ✅ Cookie-based token storage
- ✅ Role-based access control (CUSTOMER, ADMIN)
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
   Edit `.env` and update the required variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/order_management?schema=public"
   JWT_SECRET="your-secret-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
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

### Authentication
- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password, phone?, address?, role? }`
  - Role: `CUSTOMER` (default) or `ADMIN`
  - Returns: User data (password excluded) and sets JWT token in cookie
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: User data and sets JWT token in cookie

- `GET /api/auth/profile` - Get authenticated user's profile (Protected)
  - Requires: Authentication cookie or Bearer token
  - Returns: Current user's profile information

- `POST /api/auth/logout` - Logout user
  - Clears the authentication cookie
  - Returns: Success message

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

## Authentication

The project includes JWT-based authentication with the following features:

### Password Hashing
Passwords are hashed using bcrypt with 10 salt rounds before storing in the database.

### JWT Tokens
- Tokens are generated upon successful registration/login
- Tokens are stored in HTTP-only cookies for security
- Token expiration is configurable via `JWT_EXPIRES_IN` environment variable (default: 7 days)

### Protected Routes
Use the `authenticate` middleware to protect routes:

```typescript
import { authenticate, authorize } from '../middlewares';

// Protect route - requires authentication
router.get('/profile', authenticate, controller.getProfile);

// Protect route - requires ADMIN role
router.delete('/users/:id', authenticate, authorize('ADMIN'), controller.deleteUser);
```

### Role-Based Access Control
Two roles are available:
- `CUSTOMER` - Default role for registered users
- `ADMIN` - Administrative access

Users can be assigned roles during registration (only if explicitly set), otherwise defaults to `CUSTOMER`.

### Request Example

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890",
    "address": "123 Main St",
    "role": "CUSTOMER"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

The JWT token will be automatically set in cookies after successful login/register.

## Postman Collection

A complete Postman collection is available for testing all API endpoints.

### Import Collection

1. Open Postman application
2. Click **Import** button
3. Navigate to `postman/` directory
4. Import both files:
   - `Order-Management-API.postman_collection.json`
   - `Order-Management-API.postman_environment.json`
5. Select the **Order Management API - Local** environment from the dropdown

### Collection Features

- Pre-configured requests for all endpoints
- Automatic cookie management for authentication
- Test scripts for response validation
- Environment variables for easy configuration
- Separate requests for Customer and Admin users

For detailed instructions, see [postman/README.md](postman/README.md).

## Socket.IO

Socket.IO is configured for real-time communication. Customize events in `src/socket/index.ts`.

## License

ISC

