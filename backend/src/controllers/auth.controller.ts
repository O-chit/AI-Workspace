import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ok } from '../utils/apiResponse.js';

export class AuthController {
  static async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    return ok(res, result, 'Đăng ký tài khoản thành công', 201);
  }

  static async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    return ok(res, result, 'Đăng nhập thành công', 200);
  }

  static async refresh(req: Request, res: Response) {
    const tokens = await AuthService.refresh(req.body.refreshToken);
    return ok(res, tokens, 'Làm mới token thành công', 200);
  }

  static async logout(req: Request, res: Response) {
    await AuthService.logout(req.user!.id);
    return ok(res, { success: true }, 'Đăng xuất thành công', 200);
  }

  static async getMe(req: Request, res: Response) {
    const user = await AuthService.getMe(req.user!.id);
    return ok(res, user, 'Lấy thông tin người dùng thành công', 200);
  }
}
