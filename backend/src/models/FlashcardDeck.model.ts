import mongoose, { Schema } from 'mongoose';
import { IFlashcardDeck } from '../types/models.js';

const flashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    cardCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const FlashcardDeck = (mongoose.models['FlashcardDeck'] as mongoose.Model<IFlashcardDeck>) || mongoose.model<IFlashcardDeck>('FlashcardDeck', flashcardDeckSchema);
