import { z } from 'zod';

export const createNoteSchema = z.object({
  documentId: z.string().optional(),
  title: z.string().min(1, 'Tiêu đề ghi chú không được để trống'),
  content: z.string().default(''),
  personalNotes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  personalNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
});

export const generateNoteFromSessionSchema = z.object({
  sessionId: z.string().optional(),
  documentId: z.string().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type GenerateNoteFromSessionInput = z.infer<typeof generateNoteFromSessionSchema>;
