import rateLimit from 'express-rate-limit';
import { fail } from '../utils/apiResponse.js';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau 15 phút.', 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 'Quá nhiều lần thử xác thực. Vui lòng đợi 15 phút trước khi thử lại.', 429);
  },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút.', 429);
  },
});

export const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 'Bạn đã đạt giới hạn yêu cầu AI trong giờ này. Vui lòng thử lại sau.', 429);
  },
});
