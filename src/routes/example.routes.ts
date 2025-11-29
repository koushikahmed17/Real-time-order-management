import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../utils';
import { ExampleController } from '../modules/controllers/example.controller';

const router = Router();
const exampleController = new ExampleController();

// Validation schemas
const createExampleSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  }),
};

const getExampleSchema = {
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

// Routes
router.get(
  '/',
  exampleController.getAllExamples
);

router.get(
  '/:id',
  validateRequest(getExampleSchema),
  exampleController.getExample
);

router.post(
  '/',
  validateRequest(createExampleSchema),
  exampleController.createExample
);

export default router;

