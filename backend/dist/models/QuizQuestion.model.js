import mongoose, { Schema } from 'mongoose';
const quizOptionSchema = new Schema({
    key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: String, required: true },
}, { _id: false });
const quizQuestionSchema = new Schema({
    attemptId: {
        type: Schema.Types.ObjectId,
        ref: 'QuizAttempt',
        required: true,
        index: true,
    },
    order: {
        type: Number,
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    formulaHint: {
        type: String,
    },
    topic: {
        type: String,
    },
    options: [quizOptionSchema],
    correctKey: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
        required: true,
    },
    explanation: {
        type: String,
        required: true,
    },
    selectedKey: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
    },
    flaggedForReview: {
        type: Boolean,
        default: false,
    },
    isCorrect: {
        type: Boolean,
    },
}, {
    timestamps: true,
});
export const QuizQuestion = mongoose.models['QuizQuestion'] || mongoose.model('QuizQuestion', quizQuestionSchema);
