import { Router } from 'express';
import authRoutes from './auth.routes.js';
import documentRoutes from './document.routes.js';
import chatRoutes from './chat.routes.js';
import flashcardRoutes from './flashcard.routes.js';
import quizRoutes from './quiz.routes.js';
import noteRoutes from './note.routes.js';
import workspaceRoutes from './workspace.routes.js';
import { ok } from '../utils/apiResponse.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  return ok(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Lumina AI Backend API',
    version: '1.0.0',
  }, 'Hệ thống hoạt động bình thường', 200);
});

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/chat', chatRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/quiz', quizRoutes);
router.use('/notes', noteRoutes);
router.use('/workspaces', workspaceRoutes);

export default router;
