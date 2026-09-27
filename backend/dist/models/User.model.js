import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
const userSchema = new Schema({
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
}, {
    timestamps: true,
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};
export const User = mongoose.models['User'] || mongoose.model('User', userSchema);
