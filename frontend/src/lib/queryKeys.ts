export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  documents: {
    root: ['documents'] as const,
    all: (filters?: Record<string, unknown>) => (filters ? (['documents', filters] as const) : (['documents'] as const)),
    detail: (id: string) => ['documents', 'detail', id] as const,
    stats: ['documents', 'stats'] as const,
  },
  chat: {
    sessions: ['chat', 'sessions'] as const,
    messages: (sessionId: string) => ['chat', 'messages', sessionId] as const,
    suggestions: (documentId?: string) => ['chat', 'suggestions', documentId] as const,
  },
  flashcards: {
    decks: ['flashcards', 'decks'] as const,
    deckCards: (deckId: string) => ['flashcards', 'cards', deckId] as const,
    deckStats: (deckId: string) => ['flashcards', 'stats', deckId] as const,
    dueCards: ['flashcards', 'due'] as const,
  },
  quiz: {
    attempt: (id: string) => ['quiz', 'attempt', id] as const,
    result: (id: string) => ['quiz', 'result', id] as const,
  },
  notes: {
    root: ['notes'] as const,
    all: (filters?: Record<string, unknown>) => (filters ? (['notes', filters] as const) : (['notes'] as const)),
    detail: (id: string) => ['notes', 'detail', id] as const,
  },
};
