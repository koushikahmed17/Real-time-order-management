import { Router } from 'express';
import authRoutes from './auth.routes';
// import exampleRoutes from './example.routes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Import and use other route modules here
// Example:
// router.use('/examples', exampleRoutes);

export default router;

