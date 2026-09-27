import mongoose, { Schema } from 'mongoose';
const workspaceSchema = new Schema({
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
}, {
    timestamps: true,
});
export const Workspace = mongoose.models['Workspace'] || mongoose.model('Workspace', workspaceSchema);
