import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspace.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../schemas/workspace.schema.js';
import { updateProfileSchema, updatePasswordSchema } from '../schemas/auth.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(WorkspaceController.getWorkspaces));
router.post('/', validate(createWorkspaceSchema), asyncHandler(WorkspaceController.createWorkspace));
router.patch('/:id', validate(updateWorkspaceSchema), asyncHandler(WorkspaceController.updateWorkspace));
router.delete('/:id', asyncHandler(WorkspaceController.deleteWorkspace));

router.patch('/users/me', validate(updateProfileSchema), asyncHandler(WorkspaceController.updateMe));
router.patch('/users/me/password', validate(updatePasswordSchema), asyncHandler(WorkspaceController.updatePassword));

export default router;
