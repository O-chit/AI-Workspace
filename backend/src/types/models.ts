import { Types, Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  plan: 'free' | 'pro';
  storageUsedMb: number;
  storageLimitMb: number;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentFile extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  title: string;
  originalName: string;
  fileType: 'pdf' | 'docx' | 'pptx';
  fileSizeMb: number;
  pageCount?: number;
  storageUrl: string;
  extractedText?: string;
  indexStatus: 'pending' | 'processing' | 'indexed' | 'failed';
  masteryPercent: number; // 0 - 100%
  tags: string[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatSession extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  documentId?: Types.ObjectId;
  title: string;
  aiModel: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Citation {
  documentId?: string;
  documentTitle?: string;
  page?: number;
  quote: string;
}

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  structuredCards?: Array<{
    title: string;
    description: string;
    example?: string;
    tag?: string;
  }>;
  accuracyScore?: number;
  createdAt: Date;
}

export interface IFlashcardDeck extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  documentId?: Types.ObjectId;
  title: string;
  description?: string;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlashcard extends Document {
  _id: Types.ObjectId;
  deckId: Types.ObjectId;
  documentId?: Types.ObjectId;
  term: string;
  definition: string;
  formula?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // Thuật toán SRS SM-2
  easeFactor: number;
  intervalDays: number;
  dueDate: Date;
  reviewCount: number;
  status: 'new' | 'learning' | 'mastered';
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  documentId?: Types.ObjectId;
  title: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  durationSeconds: number;
  status: 'in_progress' | 'submitted';
  aiPredictedAccuracy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizQuestion extends Document {
  _id: Types.ObjectId;
  attemptId: Types.ObjectId;
  order: number;
  prompt: string;
  formulaHint?: string;
  topic?: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  selectedKey?: 'A' | 'B' | 'C' | 'D';
  flaggedForReview: boolean;
  isCorrect?: boolean;
  createdAt: Date;
}

export interface INote extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  documentId?: Types.ObjectId;
  sourceType: 'ai_generated' | 'manual';
  title: string;
  content: string; // Markdown text
  aiKeyTakeaways?: string[];
  cases?: Array<{
    title: string;
    description: string;
    example?: string;
    tag?: string;
  }>;
  personalNotes?: string;
  tags: string[];
  linkedFlashcardIds: Types.ObjectId[];
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  documentIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
