export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  storageUsedMb: number;
  storageLimitMb: number;
  avatarUrl?: string;
  createdAt?: string;
}

export interface DocumentFile {
  _id: string;
  ownerId: string;
  workspaceId?: string;
  title: string;
  originalName: string;
  fileType: 'pdf' | 'docx' | 'pptx';
  fileSizeMb: number;
  pageCount?: number;
  storageUrl: string;
  extractedText?: string;
  indexStatus: 'pending' | 'processing' | 'indexed' | 'failed';
  masteryPercent: number;
  tags: string[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  documentId?: string;
  documentTitle?: string;
  page?: number;
  quote: string;
}

export interface StructuredCard {
  title: string;
  description: string;
  example?: string;
  tag?: string;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  structuredCards?: StructuredCard[];
  accuracyScore?: number;
  createdAt: string;
}

export interface ChatSession {
  _id: string;
  ownerId: string;
  documentId?: DocumentFile | string;
  title: string;
  aiModel: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDeck {
  _id: string;
  ownerId: string;
  documentId?: DocumentFile | string;
  title: string;
  description?: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  _id: string;
  deckId: string;
  documentId?: string;
  term: string;
  definition: string;
  formula?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  easeFactor: number;
  intervalDays: number;
  dueDate: string;
  reviewCount: number;
  status: 'new' | 'learning' | 'mastered';
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  _id: string;
  attemptId: string;
  order: number;
  prompt: string;
  formulaHint?: string;
  topic?: string;
  options: QuizOption[];
  correctKey?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  selectedKey?: 'A' | 'B' | 'C' | 'D';
  flaggedForReview: boolean;
  isCorrect?: boolean;
}

export interface QuizAttempt {
  _id: string;
  ownerId: string;
  documentId: DocumentFile | string;
  title: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  durationSeconds: number;
  status: 'in_progress' | 'submitted';
  aiPredictedAccuracy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteCase {
  title: string;
  description: string;
  example?: string;
  tag?: string;
}

export interface Note {
  _id: string;
  ownerId: string;
  documentId?: DocumentFile | string;
  sourceType: 'ai_generated' | 'manual';
  title: string;
  content: string;
  aiKeyTakeaways?: string[];
  cases?: NoteCase[];
  personalNotes?: string;
  tags: string[];
  linkedFlashcardIds?: Array<Flashcard | string>;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  storageUsedMb: number;
  storageLimitMb: number;
  storagePercentage: number;
  indexedConcepts: number;
  linkedSessions: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors: Record<string, string[]> | null;
  stack?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
