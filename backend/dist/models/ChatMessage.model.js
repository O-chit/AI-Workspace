import mongoose, { Schema } from 'mongoose';
const citationSchema = new Schema({
    documentId: { type: String },
    documentTitle: { type: String },
    page: { type: Number },
    quote: { type: String, required: true },
}, { _id: false });
const structuredCardSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    example: { type: String },
    tag: { type: String },
}, { _id: false });
const chatMessageSchema = new Schema({
    sessionId: {
        type: Schema.Types.ObjectId,
        ref: 'ChatSession',
        required: true,
        index: true,
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    citations: [citationSchema],
    structuredCards: [structuredCardSchema],
    accuracyScore: {
        type: Number,
        default: 98,
    },
}, {
    timestamps: true,
});
export const ChatMessage = mongoose.models['ChatMessage'] || mongoose.model('ChatMessage', chatMessageSchema);
