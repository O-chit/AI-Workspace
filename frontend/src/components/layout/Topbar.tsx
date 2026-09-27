import React from 'react';
import { useSessionStore } from '../../stores/sessionStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { FileText, Bell, Search, LogOut } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { activeDocument } = useSessionStore();
  const { studyMode, setStudyMode } = useUiStore();
  const { user, logout } = useAuthStore();

  const docTitle = activeDocument?.title || 'Kinh_te_Vi_mo_Chuong_3.pdf';

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 z-40 flex items-center justify-between px-space-lg">
      {/* Left: Active Document Breadcrumb */}
      <div className="flex items-center gap-space-sm min-w-0">
        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex items-center gap-2 text-[14px] text-on-surface-variant min-w-0">
          <span className="font-semibold text-on-surface truncate max-w-xs md:max-w-md">
            {docTitle}
          </span>
          <span className="text-outline-variant">/</span>
          <span className="text-secondary text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary-container/40 flex-shrink-0">
            Sync Active
          </span>
        </div>
      </div>

      {/* Right: Study/Reader Focus switcher & user actions */}
      <div className="flex items-center gap-space-md">
        {/* Toggle Mode */}
        <div className="hidden sm:flex items-center p-1 bg-surface-container-low rounded-xl border border-outline-variant/20">
          <button
            onClick={() => setStudyMode('study')}
            className={`px-3 py-1 rounded-lg text-[13px] font-semibold transition-all ${
              studyMode === 'study'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Study View
          </button>
          <button
            onClick={() => setStudyMode('reader')}
            className={`px-3 py-1 rounded-lg text-[13px] font-semibold transition-all ${
              studyMode === 'reader'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Reader Focus
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            title="Tìm kiếm"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            title="Thông báo"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          </button>

          {/* User profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            />
            <span className="text-[13px] font-semibold text-on-surface hidden md:inline truncate max-w-[120px]">
              {user?.name || 'Minh Đức'}
            </span>
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-surface-container-low"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
