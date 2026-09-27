import mongoose, { Schema } from 'mongoose';
import { IQuizAttempt } from '../types/models.js';

const quizAttemptSchema = new Schema<IQuizAttempt>(
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
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    answeredCount: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted'],
      default: 'in_progress',
    },
    aiPredictedAccuracy: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const QuizAttempt = (mongoose.models['QuizAttempt'] as mongoose.Model<IQuizAttempt>) || mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
