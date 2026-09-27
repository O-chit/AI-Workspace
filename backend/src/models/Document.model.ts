import mongoose, { Schema } from 'mongoose';
import { IDocumentFile } from '../types/models.js';

const documentSchema = new Schema<IDocumentFile>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'pptx'],
      required: true,
    },
    fileSizeMb: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    storageUrl: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
    },
    indexStatus: {
      type: String,
      enum: ['pending', 'processing', 'indexed', 'failed'],
      default: 'pending',
    },
    masteryPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: {
      type: [String],
      default: [],
    },
    summary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ ownerId: 1, title: 'text', tags: 'text' });

export const DocumentModel = (mongoose.models['Document'] as mongoose.Model<IDocumentFile>) || mongoose.model<IDocumentFile>('Document', documentSchema);
