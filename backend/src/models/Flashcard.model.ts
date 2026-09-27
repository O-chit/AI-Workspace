import mongoose, { Schema } from 'mongoose';
import { IFlashcard } from '../types/models.js';

const flashcardSchema = new Schema<IFlashcard>(
  {
    deckId: {
      type: Schema.Types.ObjectId,
      ref: 'FlashcardDeck',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
    },
    formula: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    // SM-2 SRS Algorithm fields
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    intervalDays: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['new', 'learning', 'mastered'],
      default: 'new',
      index: true,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Flashcard = (mongoose.models['Flashcard'] as mongoose.Model<IFlashcard>) || mongoose.model<IFlashcard>('Flashcard', flashcardSchema);
