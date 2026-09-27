import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { aiGenerateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateQuizSchema, answerQuestionSchema } from '../schemas/quiz.schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/generate', aiGenerateLimiter, validate(generateQuizSchema), asyncHandler(QuizController.generateQuiz));
router.get('/attempts/:id', asyncHandler(QuizController.getAttempt));
router.patch('/attempts/:id/answer', validate(answerQuestionSchema), asyncHandler(QuizController.answerQuestion));
router.post('/attempts/:id/submit', asyncHandler(QuizController.submitAttempt));
router.get('/attempts/:id/result', asyncHandler(QuizController.getResult));

export default router;
