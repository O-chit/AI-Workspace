import { z } from 'zod';
export const documentQuerySchema = z.object({
    fileType: z.enum(['all', 'pdf', 'docx', 'pptx']).optional().default('all'),
    search: z.string().optional(),
    tag: z.string().optional(),
    page: z.string().transform(Number).optional().default('1'),
    limit: z.string().transform(Number).optional().default('12'),
});
export const updateDocumentSchema = z.object({
    title: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    masteryPercent: z.number().min(0).max(100).optional(),
});
