import { Workspace } from '../models/Workspace.model.js';
import { User } from '../models/User.model.js';
import bcrypt from 'bcrypt';
import { ok, fail } from '../utils/apiResponse.js';
export class WorkspaceController {
    static async getWorkspaces(req, res) {
        const workspaces = await Workspace.find({ ownerId: req.user.id }).populate('documentIds', 'title fileType');
        return ok(res, workspaces, 'Lấy danh sách workspace thành công', 200);
    }
    static async createWorkspace(req, res) {
        const ws = await Workspace.create({
            ownerId: req.user.id,
            name: req.body.name,
            documentIds: req.body.documentIds || [],
        });
        return ok(res, ws, 'Tạo workspace mới thành công', 201);
    }
    static async updateWorkspace(req, res) {
        const ws = await Workspace.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, { $set: req.body }, { new: true });
        if (!ws) {
            return fail(res, 'Workspace không tồn tại', 404);
        }
        return ok(res, ws, 'Cập nhật workspace thành công', 200);
    }
    static async deleteWorkspace(req, res) {
        const ws = await Workspace.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
        if (!ws) {
            return fail(res, 'Workspace không tồn tại để xóa', 404);
        }
        return ok(res, { success: true }, 'Xóa workspace thành công', 200);
    }
    static async updateMe(req, res) {
        const user = await User.findByIdAndUpdate(req.user.id, { $set: req.body }, { new: true }).select('-passwordHash');
        return ok(res, user, 'Cập nhật thông tin thành công', 200);
    }
    static async updatePassword(req, res) {
        const user = await User.findById(req.user.id).select('+passwordHash');
        if (!user) {
            return fail(res, 'Người dùng không tồn tại', 404);
        }
        const isMatch = await user.comparePassword(req.body.currentPassword);
        if (!isMatch) {
            return fail(res, 'Mật khẩu hiện tại không chính xác', 400);
        }
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(req.body.newPassword, salt);
        await user.save();
        return ok(res, { success: true }, 'Đổi mật khẩu thành công', 200);
    }
}
