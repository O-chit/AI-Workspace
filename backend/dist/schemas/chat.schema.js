import { z } from 'zod';
export const createSessionSchema = z.object({
    documentId: z.string().optional(),
    title: z.string().optional(),
});
export const sendMessageSchema = z.object({
    content: z.string().min(1, 'Nội dung tin nhắn không được để trống'),
    documentId: z.string().optional(),
});
export const suggestionsSchema = z.object({
    documentId: z.string().optional(),
});
