import { DocumentService } from '../services/document.service.js';
import { ok, fail } from '../utils/apiResponse.js';
export class DocumentController {
    static async getDocuments(req, res) {
        const result = await DocumentService.getDocuments(req.user.id, req.query);
        return ok(res, result, 'Lấy danh sách tài liệu thành công', 200);
    }
    static async uploadDocument(req, res) {
        if (!req.file) {
            return fail(res, 'Vui lòng chọn một tệp để tải lên', 400);
        }
        const doc = await DocumentService.uploadDocument(req.user.id, req.file, req.body.title);
        return ok(res, doc, 'Tải lên tài liệu và lập chỉ mục thành công', 201);
    }
    static async getDocumentById(req, res) {
        const doc = await DocumentService.getDocumentById(req.user.id, req.params.id);
        return ok(res, doc, 'Lấy chi tiết tài liệu thành công', 200);
    }
    static async updateDocument(req, res) {
        const doc = await DocumentService.updateDocument(req.user.id, req.params.id, req.body);
        return ok(res, doc, 'Cập nhật tài liệu thành công', 200);
    }
    static async deleteDocument(req, res) {
        await DocumentService.deleteDocument(req.user.id, req.params.id);
        return ok(res, { success: true }, 'Xóa tài liệu thành công', 200);
    }
    static async reindex(req, res) {
        const mastery = await DocumentService.calculateMastery(req.params.id);
        return ok(res, { masteryPercent: mastery }, 'Lập lại chỉ mục và đồng bộ tiến độ thành công', 200);
    }
    static async getStats(req, res) {
        const stats = await DocumentService.getStats(req.user.id);
        return ok(res, stats, 'Lấy thống kê tài liệu thành công', 200);
    }
}
