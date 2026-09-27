import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { fail } from '../utils/apiResponse.js';
import { AuthUser } from '../types/express.d.js';

interface AccessTokenPayload {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    fail(res, 'Vui lòng đăng nhập để tiếp tục.', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    fail(res, 'Token không được cung cấp.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.accessSecret) as AccessTokenPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      plan: decoded.plan || 'free',
    };
    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      fail(res, 'Phiên đăng nhập đã hết hạn. Vui lòng làm mới token hoặc đăng nhập lại.', 401);
      return;
    }
    fail(res, 'Token không hợp lệ.', 401);
  }
}
