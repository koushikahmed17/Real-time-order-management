import { Router } from 'express';
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

// Import and use other route modules here
// Example:
// router.use('/examples', exampleRoutes);

export default router;

