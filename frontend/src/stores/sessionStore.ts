import { create } from 'zustand';
import { DocumentFile } from '../types/api.js';

interface SessionState {
  activeSessionId: string | null;
  activeDocument: DocumentFile | null;
  setActiveSessionId: (id: string | null) => void;
  setActiveDocument: (doc: DocumentFile | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  activeDocument: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setActiveDocument: (doc) => set({ activeDocument: doc }),
}));
