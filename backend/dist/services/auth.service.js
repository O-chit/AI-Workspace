import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { jwtConfig } from '../config/jwt.js';
export class AuthService {
    static generateTokens(user) {
        const payload = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            plan: user.plan,
        };
        const accessToken = jwt.sign(payload, jwtConfig.accessSecret, {
            expiresIn: jwtConfig.accessExpiresIn,
        });
        const refreshToken = jwt.sign({ id: user._id.toString() }, jwtConfig.refreshSecret, {
            expiresIn: jwtConfig.refreshExpiresIn,
        });
        return { accessToken, refreshToken };
    }
    static async register(input) {
        const existing = await User.findOne({ email: input.email.toLowerCase() });
        if (existing) {
            throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(input.password, salt);
        const user = await User.create({
            email: input.email.toLowerCase(),
            passwordHash,
            name: input.name,
            plan: 'free',
            storageUsedMb: 0,
            storageLimitMb: 5000,
        });
        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();
        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                plan: user.plan,
                storageUsedMb: user.storageUsedMb,
                storageLimitMb: user.storageLimitMb,
                avatarUrl: user.avatarUrl,
            },
            ...tokens,
        };
    }
    static async login(input) {
        const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
        if (!user) {
            throw new Error('Email hoặc mật khẩu không chính xác.');
        }
        const isMatch = await user.comparePassword(input.password);
        if (!isMatch) {
            throw new Error('Email hoặc mật khẩu không chính xác.');
        }
        const tokens = this.generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();
        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                plan: user.plan,
                storageUsedMb: user.storageUsedMb,
                storageLimitMb: user.storageLimitMb,
                avatarUrl: user.avatarUrl,
            },
            ...tokens,
        };
    }
    static async refresh(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
            const user = await User.findById(decoded.id).select('+refreshToken');
            if (!user || user.refreshToken !== refreshToken) {
                throw new Error('Refresh token không hợp lệ hoặc đã bị thu hồi.');
            }
            const tokens = this.generateTokens(user);
            user.refreshToken = tokens.refreshToken;
            await user.save();
            return tokens;
        }
        catch {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
    }
    static async logout(userId) {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
        return true;
    }
    static async getMe(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy thông tin người dùng.');
        }
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            plan: user.plan,
            storageUsedMb: user.storageUsedMb,
            storageLimitMb: user.storageLimitMb,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
        };
    }
}
