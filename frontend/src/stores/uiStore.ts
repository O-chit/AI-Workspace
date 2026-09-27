import { create } from 'zustand';

interface UiState {
  studyMode: 'study' | 'reader';
  isSidebarOpen: boolean;
  setStudyMode: (mode: 'study' | 'reader') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  studyMode: 'study',
  isSidebarOpen: true,
  setStudyMode: (mode) => set({ studyMode: mode }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
