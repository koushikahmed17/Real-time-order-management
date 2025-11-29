import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data?: T,
  message?: string
): Response => {
  const response: ApiResponse<T> = {
    success: statusCode >= 200 && statusCode < 300,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response => {
  return sendResponse(res, statusCode, data, message);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

