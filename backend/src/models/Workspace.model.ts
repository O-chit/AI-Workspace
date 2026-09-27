import mongoose, { Schema } from 'mongoose';
import { IWorkspace } from '../types/models.js';

const workspaceSchema = new Schema<IWorkspace>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    documentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Workspace = (mongoose.models['Workspace'] as mongoose.Model<IWorkspace>) || mongoose.model<IWorkspace>('Workspace', workspaceSchema);
