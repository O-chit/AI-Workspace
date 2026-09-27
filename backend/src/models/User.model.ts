import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../types/models.js';

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    storageUsedMb: {
      type: Number,
      default: 0,
    },
    storageLimitMb: {
      type: Number,
      default: 5000, // 5GB default
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = (mongoose.models['User'] as UserModel) || mongoose.model<IUser, UserModel>('User', userSchema);
