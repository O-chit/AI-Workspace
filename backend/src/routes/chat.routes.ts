import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { chatLimiter } from '../middlewares/rateLimiter.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createSessionSchema, sendMessageSchema, suggestionsSchema } from '../schemas/chat.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/sessions', asyncHandler(ChatController.getSessions));
router.post('/sessions', validate(createSessionSchema), asyncHandler(ChatController.createSession));
router.delete('/sessions/:id', asyncHandler(ChatController.deleteSession));
router.get('/sessions/:id/messages', asyncHandler(ChatController.getMessages));
router.post('/sessions/:id/messages', chatLimiter, validate(sendMessageSchema), asyncHandler(ChatController.sendMessage));
router.post('/suggestions', validate(suggestionsSchema), asyncHandler(ChatController.getSuggestions));

export default router;
