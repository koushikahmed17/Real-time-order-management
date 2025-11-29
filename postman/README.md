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
- `POST /api/orders` - Create a new order (Protected)
- `POST /api/orders` (PayPal) - Create order with PayPal payment method

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
   - The order ID will be automatically saved to the environment

### Testing

The collection includes test scripts that:
- Validate response status codes
- Check response structure
- Save tokens (`access_token`, `refresh_token`) to environment variables after login
- Save `order_id` after creating an order

## Notes

- Cookies are automatically managed by Postman when using the collection
- JWT tokens (accessToken and refreshToken) are stored in HTTP-only cookies, which Postman handles automatically
- For Bearer token authentication, use the Authorization header with the `{{access_token}}` variable
- Make sure your server is running before making requests
- Login responses now return only `accessToken` and `refreshToken` (no user data)

## Customization

You can customize the collection by:
- Adding new requests for additional endpoints
- Modifying test scripts for custom validations
- Creating additional environments for different environments (staging, production)
- Adding pre-request scripts for dynamic values

