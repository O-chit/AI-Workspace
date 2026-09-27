import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Lumina AI Backend server is running at http://localhost:${env.PORT}`);
    logger.info(`📡 Health check available at http://localhost:${env.PORT}/api/health`);
    logger.info(`✨ Mode: ${env.NODE_ENV}`);
  });

  const shutdown = () => {
    logger.info('🛑 Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
