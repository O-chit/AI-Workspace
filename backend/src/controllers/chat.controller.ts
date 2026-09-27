import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service.js';
import { ok } from '../utils/apiResponse.js';

export class ChatController {
  static async getSessions(req: Request, res: Response) {
    const sessions = await ChatService.getSessions(req.user!.id);
    return ok(res, sessions, 'Lấy danh sách phiên trò chuyện thành công', 200);
  }

  static async createSession(req: Request, res: Response) {
    const session = await ChatService.createSession(req.user!.id, req.body);
    return ok(res, session, 'Tạo phiên trò chuyện mới thành công', 201);
  }

  static async deleteSession(req: Request, res: Response) {
    await ChatService.deleteSession(req.user!.id, req.params.id!);
    return ok(res, { success: true }, 'Xóa phiên trò chuyện thành công', 200);
  }

  static async getMessages(req: Request, res: Response) {
    const messages = await ChatService.getMessages(req.user!.id, req.params.id!);
    return ok(res, messages, 'Lấy lịch sử tin nhắn thành công', 200);
  }

  static async sendMessage(req: Request, res: Response) {
    const result = await ChatService.sendMessage(req.user!.id, req.params.id!, req.body.content, req.body.documentId);
    return ok(res, result, 'Gửi tin nhắn thành công', 200);
  }

  static async getSuggestions(req: Request, res: Response) {
    const suggestions = await ChatService.getSuggestions(req.user!.id, req.body.documentId);
    return ok(res, suggestions, 'Lấy danh sách gợi ý thành công', 200);
  }
}
