import { Request, Response } from 'express';
import { NoteService } from '../services/note.service.js';
import { ok } from '../utils/apiResponse.js';

export class NoteController {
  static async getNotes(req: Request, res: Response) {
    const { search, tag } = req.query as { search?: string; tag?: string };
    const notes = await NoteService.getNotes(req.user!.id, search, tag);
    return ok(res, notes, 'Lấy danh sách ghi chú thành công', 200);
  }

  static async getNoteById(req: Request, res: Response) {
    const note = await NoteService.getNoteById(req.user!.id, req.params.id!);
    return ok(res, note, 'Lấy chi tiết ghi chú thành công', 200);
  }

  static async createNote(req: Request, res: Response) {
    const note = await NoteService.createNote(req.user!.id, req.body);
    return ok(res, note, 'Tạo ghi chú thành công', 201);
  }

  static async updateNote(req: Request, res: Response) {
    const note = await NoteService.updateNote(req.user!.id, req.params.id!, req.body);
    return ok(res, note, 'Cập nhật ghi chú thành công', 200);
  }

  static async deleteNote(req: Request, res: Response) {
    await NoteService.deleteNote(req.user!.id, req.params.id!);
    return ok(res, { success: true }, 'Xóa ghi chú thành công', 200);
  }

  static async generateFromSession(req: Request, res: Response) {
    const note = await NoteService.generateFromSession(
      req.user!.id,
      req.body.sessionId,
      req.body.documentId
    );
    return ok(res, note, 'AI tổng hợp ghi chú thông minh thành công', 201);
  }

  static async convertToFlashcards(req: Request, res: Response) {
    const result = await NoteService.convertToFlashcards(req.user!.id, req.params.id!);
    return ok(res, result, 'Chuyển đổi ghi chú thành bộ Flashcard thành công', 201);
  }
}
