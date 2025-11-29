import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  throw new AppError(`Route ${req.originalUrl} not found`, 404);
};

