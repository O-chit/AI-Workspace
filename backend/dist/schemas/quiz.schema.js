import { z } from 'zod';
export const generateQuizSchema = z.object({
    documentId: z.string().min(1, 'Vui lòng chọn tài liệu'),
    questionCount: z.number().int().min(1).max(30).default(10),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    title: z.string().optional(),
});
export const answerQuestionSchema = z.object({
    questionId: z.string().min(1),
    selectedKey: z.enum(['A', 'B', 'C', 'D']).optional(),
    flaggedForReview: z.boolean().optional(),
});
