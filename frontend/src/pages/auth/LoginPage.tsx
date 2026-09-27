import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { axiosClient } from '../../lib/axiosClient.js';
import { ApiSuccess } from '../../types/api.js';
import { ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = (await axiosClient.post('/auth/login', {
        email,
        password,
      })) as unknown as ApiSuccess<{
        user: any;
        accessToken: string;
        refreshToken: string;
      }>;

      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate('/assistant');
    } catch (err: any) {
      setError(err?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@lumina.edu.vn');
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-8 shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold text-[22px] shadow-md shadow-primary/30">
            L
          </div>
          <h1 className="font-headline-md text-[24px] font-bold text-on-surface">
            Đăng nhập Lumina AI
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant">
            Trợ lý học tập thông minh cá nhân hóa cho sinh viên
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error/10 text-error text-[13px] border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-on-surface">Email sinh viên</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@lumina.edu.vn"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-[14px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-on-surface">Mật khẩu</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-[14px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-[14px] shadow-md shadow-primary/25 hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-secondary-container/40 text-on-secondary-container font-semibold text-[13px] hover:bg-secondary-container/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Điền tài khoản Demo mẫu</span>
          </button>
        </form>

        <div className="text-center text-[13px] text-on-surface-variant border-t border-outline-variant/20 pt-4">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
