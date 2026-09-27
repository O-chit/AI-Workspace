import mongoose, { Schema } from 'mongoose';
import { INote } from '../types/models.js';

const noteCaseSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    example: { type: String },
    tag: { type: String },
  },
  { _id: false }
);

const noteSchema = new Schema<INote>(
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
    sourceType: {
      type: String,
      enum: ['ai_generated', 'manual'],
      default: 'manual',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    aiKeyTakeaways: {
      type: [String],
      default: [],
    },
    cases: [noteCaseSchema],
    personalNotes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    linkedFlashcardIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Flashcard',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ ownerId: 1, title: 'text', content: 'text' });

export const Note = (mongoose.models['Note'] as mongoose.Model<INote>) || mongoose.model<INote>('Note', noteSchema);
