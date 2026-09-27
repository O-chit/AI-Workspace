import { Request, Response } from 'express';
import { FlashcardService } from '../services/flashcard.service.js';
import { ok } from '../utils/apiResponse.js';

export class FlashcardController {
  static async getDecks(req: Request, res: Response) {
    const decks = await FlashcardService.getDecks(req.user!.id);
    return ok(res, decks, 'Lấy danh sách bộ thẻ thành công', 200);
  }

  static async createDeck(req: Request, res: Response) {
    const deck = await FlashcardService.createDeck(req.user!.id, req.body);
    return ok(res, deck, 'Tạo bộ thẻ thành công', 201);
  }

  static async getDeckCards(req: Request, res: Response) {
    const cards = await FlashcardService.getDeckCards(req.params.id!);
    return ok(res, cards, 'Lấy danh sách thẻ trong bộ thành công', 200);
  }

  static async getDeckStats(req: Request, res: Response) {
    const stats = await FlashcardService.getDeckStats(req.params.id!);
    return ok(res, stats, 'Lấy thống kê bộ thẻ thành công', 200);
  }

  static async generateCards(req: Request, res: Response) {
    const cards = await FlashcardService.generateCardsFromDoc(
      req.user!.id,
      req.params.id!,
      req.body.documentId,
      req.body.count || 10
    );
    return ok(res, cards, 'AI đã trích xuất flashcard từ tài liệu thành công', 201);
  }

  static async reviewCard(req: Request, res: Response) {
    const card = await FlashcardService.reviewCard(req.user!.id, req.params.id!, req.body.rating);
    return ok(res, card, 'Cập nhật ôn tập thẻ SRS thành công', 200);
  }

  static async getDueCards(req: Request, res: Response) {
    const cards = await FlashcardService.getDueCards(req.user!.id);
    return ok(res, cards, 'Lấy danh sách thẻ cần ôn tập hôm nay thành công', 200);
  }
}
