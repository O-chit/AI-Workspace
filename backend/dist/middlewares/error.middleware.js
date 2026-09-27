import { ZodError } from 'zod';
import { fail } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
export function errorHandler(err, _req, res, _next) {
    logger.error('Unhandled Error:', err?.message || err);
    // Mongoose duplicate key error (E11000)
    if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        fail(res, `${field} này đã tồn tại trong hệ thống.`, 409, {
            [field]: [`Giá trị ${field} đã được sử dụng.`],
        });
        return;
    }
    // Mongoose CastError (invalid ObjectId)
    if (err?.name === 'CastError') {
        fail(res, `Định dạng ID không hợp lệ cho trường ${err.path}.`, 400);
        return;
    }
    // Mongoose ValidationError
    if (err?.name === 'ValidationError') {
        const errors = {};
        for (const key of Object.keys(err.errors || {})) {
            errors[key] = [err.errors[key].message];
        }
        fail(res, 'Dữ liệu không đáp ứng yêu cầu xác thực.', 400, errors);
        return;
    }
    // Zod error
    if (err instanceof ZodError) {
        const errors = {};
        for (const issue of err.issues) {
            const path = issue.path.join('.') || 'root';
            if (!errors[path])
                errors[path] = [];
            errors[path].push(issue.message);
        }
        fail(res, 'Dữ liệu không hợp lệ.', 400, errors);
        return;
    }
    // Multer error
    if (err?.code === 'LIMIT_FILE_SIZE') {
        fail(res, 'Tệp tải lên vượt quá dung lượng cho phép (tối đa 50MB).', 413);
        return;
    }
    // JWT errors
    if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
        fail(res, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401);
        return;
    }
    // Default server error
    const message = err?.message || 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.';
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    fail(res, message, status, null, err?.stack);
}
