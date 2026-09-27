import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { fail } from '../utils/apiResponse.js';
export function authMiddleware(req, res, next) {
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
        const decoded = jwt.verify(token, jwtConfig.accessSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            plan: decoded.plan || 'free',
        };
        next();
    }
    catch (error) {
        if (error?.name === 'TokenExpiredError') {
            fail(res, 'Phiên đăng nhập đã hết hạn. Vui lòng làm mới token hoặc đăng nhập lại.', 401);
            return;
        }
        fail(res, 'Token không hợp lệ.', 401);
    }
}
