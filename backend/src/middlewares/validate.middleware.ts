import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { fail } from '../utils/apiResponse.js';

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || 'root';
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
        fail(res, 'Dữ liệu đầu vào không hợp lệ', 400, errors);
        return;
      }
      next(err);
    }
  };
}
