import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../utils';
import { authenticate } from '../middlewares';
import { AuthController } from '../modules/controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Role enum for Zod validation
const RoleEnum = z.enum(['CUSTOMER', 'ADMIN']);

// Register validation schema
const registerSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    address: z.string().optional(),
    role: RoleEnum.optional(),
  }),
};

// Login validation schema
const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

// Routes
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/login',
  validateRequest(loginSchema),
  authController.login
);

router.post('/logout', authController.logout);

router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

export default router;

