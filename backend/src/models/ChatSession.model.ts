import mongoose, { Schema } from 'mongoose';
import { IChatSession } from '../types/models.js';

const chatSessionSchema = new Schema<IChatSession>(
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
      default: 'Phiên học mới',
      trim: true,
    },
    aiModel: {
      type: String,
      default: 'gemini-3.5-flash-lite',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatSession = (mongoose.models['ChatSession'] as mongoose.Model<IChatSession>) || mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
