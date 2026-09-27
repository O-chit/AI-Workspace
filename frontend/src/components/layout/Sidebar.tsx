import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useSessionStore } from '../../stores/sessionStore.js';
import {
  MessageSquare,
  FolderOpen,
  Layers,
  HelpCircle,
  FileText,
  Plus,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { setActiveSessionId } = useSessionStore();
  const navigate = useNavigate();

  const handleNewSession = () => {
    setActiveSessionId(null);
    navigate('/assistant');
  };

  const navItems = [
    { label: 'AI Assistant', path: '/assistant', icon: MessageSquare },
    { label: 'Document Library', path: '/documents', icon: FolderOpen },
    { label: 'Flashcards', path: '/flashcards', icon: Layers },
    { label: 'Quiz Mode', path: '/quiz', icon: HelpCircle },
    { label: 'Saved Notes', path: '/notes', icon: FileText },
  ];

  const storageUsed = user?.storageUsedMb ? (user.storageUsedMb / 1024).toFixed(1) : '1.4';
  const storageLimit = user?.storageLimitMb ? (user.storageLimitMb / 1024).toFixed(1) : '5.0';
  const storagePercent = user?.storageLimitMb
    ? Math.min(100, Math.round((user.storageUsedMb / user.storageLimitMb) * 100))
    : 28;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-outline-variant/30">
      <div className="flex flex-col">
        {/* Logo */}
        <div className="h-16 px-space-md flex items-center gap-space-sm border-b border-outline-variant/20">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-md shadow-primary/20">
            L
          </div>
          <span className="font-headline-sm text-[20px] font-bold text-primary tracking-tight">
            Lumina AI
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-secondary-container text-on-secondary-container ml-auto">
            PRO
          </span>
        </div>

        {/* New Session Button */}
        <div className="px-space-md py-space-sm mt-1">
          <button
            onClick={handleNewSession}
            className="flex items-center justify-center gap-space-sm w-full py-2.5 px-space-md rounded-xl bg-primary text-on-primary font-semibold text-[14px] shadow-[0_4px_14px_rgba(42,20,180,0.25)] hover:bg-primary-container transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Phiên học mới</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-space-sm mt-space-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-space-md py-2.5 rounded-xl font-medium text-[14px] transition-all ${
                    isActive
                      ? 'bg-primary-fixed text-on-primary-fixed font-bold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Account & Storage info */}
      <div className="p-space-md border-t border-outline-variant/20 flex flex-col gap-2">
        <div className="flex items-center gap-space-sm p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-container flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-bold text-on-surface truncate">
              {user?.name || 'Học giả Pro'}
            </span>
            <span className="text-[11px] text-on-surface-variant truncate">
              {storageUsed} / {storageLimit} GB Synced ({storagePercent}%)
            </span>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-300"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Đăng xuất"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
