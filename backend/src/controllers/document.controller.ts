import { Request, Response } from 'express';
import { DocumentService } from '../services/document.service.js';
import { ok, fail } from '../utils/apiResponse.js';

export class DocumentController {
  static async getDocuments(req: Request, res: Response) {
    const result = await DocumentService.getDocuments(req.user!.id, req.query as any);
    return ok(res, result, 'Lấy danh sách tài liệu thành công', 200);
  }

  static async uploadDocument(req: Request, res: Response) {
    if (!req.file) {
      return fail(res, 'Vui lòng chọn một tệp để tải lên', 400);
    }
    const doc = await DocumentService.uploadDocument(req.user!.id, req.file, req.body.title);
    return ok(res, doc, 'Tải lên tài liệu và lập chỉ mục thành công', 201);
  }

  static async getDocumentById(req: Request, res: Response) {
    const doc = await DocumentService.getDocumentById(req.user!.id, req.params.id!);
    return ok(res, doc, 'Lấy chi tiết tài liệu thành công', 200);
  }

  static async updateDocument(req: Request, res: Response) {
    const doc = await DocumentService.updateDocument(req.user!.id, req.params.id!, req.body);
    return ok(res, doc, 'Cập nhật tài liệu thành công', 200);
  }

  static async deleteDocument(req: Request, res: Response) {
    await DocumentService.deleteDocument(req.user!.id, req.params.id!);
    return ok(res, { success: true }, 'Xóa tài liệu thành công', 200);
  }

  static async reindex(req: Request, res: Response) {
    const mastery = await DocumentService.calculateMastery(req.params.id!);
    return ok(res, { masteryPercent: mastery }, 'Lập lại chỉ mục và đồng bộ tiến độ thành công', 200);
  }

  static async getStats(req: Request, res: Response) {
    const stats = await DocumentService.getStats(req.user!.id);
    return ok(res, stats, 'Lấy thống kê tài liệu thành công', 200);
  }
}
