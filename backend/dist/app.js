import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import { fail } from './utils/apiResponse.js';
export function createApp() {
    const app = express();
    // Security headers
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    // CORS configuration
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, or local dev)
            if (!origin || origin.startsWith('http://localhost') || origin === env.CORS_ORIGIN) {
                callback(null, true);
            }
            else {
                callback(null, true); // Permissive in development
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    // Body parser
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    // Static uploads directory
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsDir));
    // Global rate limiter
    app.use('/api', apiLimiter);
    // Mount API routes
    app.use('/api', routes);
    // 404 Not Found Handler for API routes
    app.use('/api', (req, res) => {
        fail(res, `Đường dẫn ${req.originalUrl} không tồn tại trên hệ thống.`, 404);
    });
    // Global Error Handler
    app.use(errorHandler);
    return app;
}
