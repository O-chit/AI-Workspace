import { Request, Response } from 'express';
import { QuizService } from '../services/quiz.service.js';
import { ok } from '../utils/apiResponse.js';

export class QuizController {
  static async generateQuiz(req: Request, res: Response) {
    const result = await QuizService.generateQuiz(req.user!.id, req.body);
    return ok(res, result, 'AI sinh đề thi trắc nghiệm thành công', 201);
  }

  static async getAttempt(req: Request, res: Response) {
    const result = await QuizService.getAttempt(req.user!.id, req.params.id!);
    return ok(res, result, 'Lấy thông tin đề thi thành công', 200);
  }

  static async answerQuestion(req: Request, res: Response) {
    const result = await QuizService.answerQuestion(
      req.user!.id,
      req.params.id!,
      req.body.questionId,
      req.body.selectedKey,
      req.body.flaggedForReview
    );
    return ok(res, result, 'Cập nhật câu trả lời thành công', 200);
  }

  static async submitAttempt(req: Request, res: Response) {
    const result = await QuizService.submitAttempt(req.user!.id, req.params.id!, req.body.durationSeconds);
    return ok(res, result, 'Nộp bài và chấm điểm hoàn tất', 200);
  }

  static async getResult(req: Request, res: Response) {
    const result = await QuizService.getResult(req.user!.id, req.params.id!);
    return ok(res, result, 'Lấy kết quả bài thi thành công', 200);
  }
}
