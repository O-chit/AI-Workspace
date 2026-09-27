import { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors: Record<string, string[]> | null;
  stack?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(res: Response, data: T, message = 'Success', statusCode = 200): Response {
  const payload: ApiSuccess<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(payload);
}

export function fail(
  res: Response,
  message = 'An error occurred',
  statusCode = 400,
  errors: Record<string, string[]> | null = null,
  stack?: string
): Response {
  const payload: ApiError = {
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
  };
  return res.status(statusCode).json(payload);
}
