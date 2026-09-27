import { z } from 'zod';

export const createDeckSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bộ thẻ không được để trống'),
  description: z.string().optional(),
  documentId: z.string().optional(),
});

export const generateFlashcardsSchema = z.object({
  documentId: z.string().min(1, 'Vui lòng chọn tài liệu'),
  count: z.number().int().min(1).max(30).default(10),
});

export const reviewCardSchema = z.object({
  rating: z.enum(['again', 'hard', 'good', 'easy']),
});

export const createManualCardSchema = z.object({
  deckId: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
  formula: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
export type ReviewCardInput = z.infer<typeof reviewCardSchema>;
export type CreateManualCardInput = z.infer<typeof createManualCardSchema>;
