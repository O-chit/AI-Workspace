import { QuizAttempt } from '../models/QuizAttempt.model.js';
import { QuizQuestion } from '../models/QuizQuestion.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { AiService } from './ai.service.js';
import { DocumentService } from './document.service.js';
export class QuizService {
    /**
     * Tính toán độ chính xác chạy theo thời gian thực (Section 5.3):
     * runningAccuracy = Math.round((correctCount / answeredCount) * 100)
     */
    static calculateRunningAccuracy(correctCount, answeredCount) {
        if (answeredCount <= 0)
            return 0;
        return Math.round((correctCount / answeredCount) * 100);
    }
    static async generateQuiz(userId, input) {
        const doc = await DocumentModel.findOne({ _id: input.documentId, ownerId: userId });
        if (!doc || !doc.extractedText) {
            throw new Error('Tài liệu không có nội dung để sinh đề thi.');
        }
        const title = input.title || `Trắc nghiệm: ${doc.title} (${input.difficulty.toUpperCase()})`;
        const questionsData = await AiService.generateQuiz({
            documentText: doc.extractedText,
            questionCount: input.questionCount,
            difficulty: input.difficulty,
        });
        const attempt = await QuizAttempt.create({
            ownerId: userId,
            documentId: doc._id,
            title,
            totalQuestions: questionsData.length,
            answeredCount: 0,
            correctCount: 0,
            durationSeconds: 0,
            status: 'in_progress',
            aiPredictedAccuracy: 0,
        });
        const questions = await Promise.all(questionsData.map((q, idx) => QuizQuestion.create({
            attemptId: attempt._id,
            order: idx + 1,
            prompt: q.prompt,
            formulaHint: q.formulaHint,
            topic: q.topic || 'Kiến thức cốt lõi',
            options: q.options,
            correctKey: q.correctKey,
            explanation: q.explanation,
            flaggedForReview: false,
        })));
        return {
            attempt,
            questions,
        };
    }
    static async getAttempt(userId, attemptId) {
        const attempt = await QuizAttempt.findOne({ _id: attemptId, ownerId: userId }).populate('documentId', 'title');
        if (!attempt) {
            throw new Error('Đề thi không tồn tại.');
        }
        const questions = await QuizQuestion.find({ attemptId }).sort({ order: 1 });
        // If still in progress, mask correctKey & explanation to prevent cheating, but allow selectedKey
        const sanitizedQuestions = questions.map((q) => {
            const qObj = q.toObject();
            if (attempt.status === 'in_progress') {
                return {
                    ...qObj,
                    correctKey: undefined,
                    explanation: undefined,
                };
            }
            return qObj;
        });
        return {
            attempt,
            questions: sanitizedQuestions,
        };
    }
    static async answerQuestion(userId, attemptId, questionId, selectedKey, flaggedForReview) {
        const attempt = await QuizAttempt.findOne({ _id: attemptId, ownerId: userId });
        if (!attempt) {
            throw new Error('Đề thi không tồn tại.');
        }
        if (attempt.status === 'submitted') {
            throw new Error('Đề thi đã nộp, không thể thay đổi đáp án.');
        }
        const question = await QuizQuestion.findOne({ _id: questionId, attemptId });
        if (!question) {
            throw new Error('Câu hỏi không tồn tại.');
        }
        if (selectedKey !== undefined) {
            question.selectedKey = selectedKey;
            question.isCorrect = selectedKey === question.correctKey;
        }
        if (flaggedForReview !== undefined) {
            question.flaggedForReview = flaggedForReview;
        }
        await question.save();
        // Recalculate statistics
        const allQuestions = await QuizQuestion.find({ attemptId });
        const answeredCount = allQuestions.filter((q) => q.selectedKey).length;
        const correctCount = allQuestions.filter((q) => q.isCorrect).length;
        attempt.answeredCount = answeredCount;
        attempt.correctCount = correctCount;
        attempt.aiPredictedAccuracy = this.calculateRunningAccuracy(correctCount, answeredCount);
        await attempt.save();
        return {
            question,
            answeredCount,
            correctCount,
            aiPredictedAccuracy: attempt.aiPredictedAccuracy,
        };
    }
    static async submitAttempt(userId, attemptId, durationSeconds) {
        const attempt = await QuizAttempt.findOne({ _id: attemptId, ownerId: userId });
        if (!attempt) {
            throw new Error('Đề thi không tồn tại.');
        }
        const allQuestions = await QuizQuestion.find({ attemptId });
        let correctCount = 0;
        let answeredCount = 0;
        for (const q of allQuestions) {
            if (q.selectedKey) {
                answeredCount++;
                q.isCorrect = q.selectedKey === q.correctKey;
                if (q.isCorrect)
                    correctCount++;
                await q.save();
            }
        }
        attempt.status = 'submitted';
        attempt.answeredCount = answeredCount;
        attempt.correctCount = correctCount;
        if (durationSeconds)
            attempt.durationSeconds = durationSeconds;
        attempt.aiPredictedAccuracy = this.calculateRunningAccuracy(correctCount, attempt.totalQuestions);
        await attempt.save();
        // Update document mastery
        if (attempt.documentId) {
            await DocumentService.calculateMastery(attempt.documentId.toString());
        }
        return this.getResult(userId, attemptId);
    }
    static async getResult(userId, attemptId) {
        const attempt = await QuizAttempt.findOne({ _id: attemptId, ownerId: userId }).populate('documentId', 'title');
        if (!attempt) {
            throw new Error('Đề thi không tồn tại.');
        }
        const questions = await QuizQuestion.find({ attemptId }).sort({ order: 1 });
        return {
            attempt,
            questions,
            scorePercent: attempt.totalQuestions > 0 ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100) : 0,
        };
    }
}
