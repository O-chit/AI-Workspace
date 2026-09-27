import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';
import {
  MessageSquare,
  FolderOpen,
  Layers,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const AppShell: React.FC = () => {
  const mobileNav = [
    { label: 'Hỏi đáp', path: '/assistant', icon: MessageSquare },
    { label: 'Tài liệu', path: '/documents', icon: FolderOpen },
    { label: 'Flashcard', path: '/flashcards', icon: Layers },
    { label: 'Đề thi', path: '/quiz', icon: HelpCircle },
    { label: 'Ghi chú', path: '/notes', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">
        <Topbar />
        <main className="w-full pt-16 min-h-screen">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (<768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-lg border-t border-outline-variant/30 z-50 flex items-center justify-around px-2">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
