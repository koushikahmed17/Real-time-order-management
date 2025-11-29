# Postman Collection for Order Management API

This directory contains Postman collection and environment files for testing the Order Management API.

## Files

- `Order-Management-API.postman_collection.json` - Complete API collection with all endpoints
- `Order-Management-API.postman_environment.json` - Environment variables for local development

## Import Instructions

### Option 1: Import via Postman UI

1. Open Postman application
2. Click **Import** button (top left)
3. Select both files:
   - `Order-Management-API.postman_collection.json`
   - `Order-Management-API.postman_environment.json`
4. Click **Import**

### Option 2: Import via Postman CLI

```bash
# Install Postman CLI (Newman)
npm install -g newman

# Run collection
newman run postman/Order-Management-API.postman_collection.json -e postman/Order-Management-API.postman_environment.json
```

## Environment Setup

1. After importing, select the **Order Management API - Local** environment from the dropdown (top right)
2. Update the `base_url` variable if your server is running on a different port
3. The `access_token` and `refresh_token` will be automatically set when you login
4. The `order_id` will be automatically saved after creating an order

## Collection Structure

### Health Check
- `GET /api/health` - Check server status

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/register` (Admin) - Register an admin user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/login` (Admin) - Login as admin
- `GET /api/auth/profile` - Get authenticated user's profile
- `POST /api/auth/logout` - Logout and clear cookies

### Order Management
- `POST /api/orders` - Create a new order with Stripe payment (Protected)
  - Returns: `clientSecret` for Stripe payment confirmation
- `POST /api/orders` (PayPal) - Create order with PayPal payment method (Protected)
  - Returns: `approvalUrl` for PayPal checkout redirect

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint
  - Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - Updates order payment and order status automatically
- `POST /api/webhooks/paypal` - PayPal webhook endpoint
  - Handles: `PAYMENT.CAPTURE.COMPLETED`, `DENIED`, `REFUNDED`
  - Updates order payment and order status automatically

### Examples
- `GET /api/examples` - Get all examples
- `GET /api/examples/:id` - Get example by ID
- `POST /api/examples` - Create a new example

## Using the Collection

### Authentication Flow

1. **Register a new user:**
   - Use "Register" request
   - Modify the request body with your details
   - The JWT token will be automatically stored in cookies

2. **Login:**
   - Use "Login" request
   - Provide your email and password
   - The token will be set in cookies automatically

3. **Access protected routes:**
   - Most routes use cookie-based authentication (tokens are automatically stored in cookies)
   - For Bearer token authentication, use the Authorization header with `{{access_token}}` variable
   - The `access_token` and `refresh_token` environment variables will be set automatically after login

4. **Create an order:**
   - Use "Create Order" request after logging in
   - The request requires authentication (Bearer token or cookie)
   - **Stripe**: Response includes `clientSecret` for frontend payment confirmation
   - **PayPal**: Response includes `approvalUrl` for redirecting user to PayPal checkout
   - The order ID and payment details will be automatically saved to the environment

### Testing

The collection includes test scripts that:
- Validate response status codes
- Check response structure
- Save tokens (`access_token`, `refresh_token`) to environment variables after login
- Save `order_id` and payment details after creating an order
- For Stripe: saves `stripe_client_secret` and `stripe_payment_intent_id`
- For PayPal: saves `paypal_approval_url` and `paypal_order_id`

## Notes

- Cookies are automatically managed by Postman when using the collection
- JWT tokens (accessToken and refreshToken) are stored in HTTP-only cookies, which Postman handles automatically
- For Bearer token authentication, use the Authorization header with the `{{access_token}}` variable
- Make sure your server is running before making requests
- Login responses now return only `accessToken` and `refreshToken` (no user data)

### Payment Testing

**Stripe:**
- Use Stripe test cards (e.g., `4242 4242 4242 4242`) for testing
- Use Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- The webhook will automatically update order status when payment succeeds

**PayPal:**
- Use PayPal sandbox accounts for testing
- Configure webhooks in PayPal Developer Dashboard
- The webhook will automatically update order status when payment completes

### Webhook Testing

⚠️ **Note**: Webhook endpoints require proper signature verification. For local testing:

- **Stripe**: Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- **PayPal**: Use PayPal Developer Dashboard webhook simulator or ngrok for local testing

The webhook requests in the collection are examples and may not work without proper signatures. Use the tools mentioned above for actual testing.

## Customization

You can customize the collection by:
- Adding new requests for additional endpoints
- Modifying test scripts for custom validations
- Creating additional environments for different environments (staging, production)
- Adding pre-request scripts for dynamic values

