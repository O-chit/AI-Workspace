import { z } from 'zod';
export const createWorkspaceSchema = z.object({
    name: z.string().min(1, 'Tên workspace không được để trống'),
    documentIds: z.array(z.string()).optional(),
});
export const updateWorkspaceSchema = z.object({
    name: z.string().min(1).optional(),
    documentIds: z.array(z.string()).optional(),
});
