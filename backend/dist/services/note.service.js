import { Note } from '../models/Note.model.js';
import { ChatMessage } from '../models/ChatMessage.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { FlashcardDeck } from '../models/FlashcardDeck.model.js';
import { Flashcard } from '../models/Flashcard.model.js';
import { AiService } from './ai.service.js';
export class NoteService {
    static async getNotes(userId, search, tag) {
        const filter = { ownerId: userId };
        if (tag) {
            filter['tags'] = tag;
        }
        if (search) {
            filter['$or'] = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }
        return Note.find(filter)
            .populate('documentId', 'title fileType')
            .populate('linkedFlashcardIds', 'term definition')
            .sort({ isPinned: -1, updatedAt: -1 });
    }
    static async getNoteById(userId, id) {
        const note = await Note.findOne({ _id: id, ownerId: userId })
            .populate('documentId', 'title fileType pageCount')
            .populate('linkedFlashcardIds', 'term definition formula status');
        if (!note) {
            throw new Error('Ghi chú không tồn tại.');
        }
        return note;
    }
    static async createNote(userId, input) {
        const note = await Note.create({
            ownerId: userId,
            documentId: input.documentId || null,
            sourceType: 'manual',
            title: input.title,
            content: input.content || '',
            personalNotes: input.personalNotes || '',
            tags: input.tags || ['#GhiChu'],
            linkedFlashcardIds: [],
        });
        return note;
    }
    static async updateNote(userId, id, input) {
        const note = await Note.findOneAndUpdate({ _id: id, ownerId: userId }, { $set: input }, { new: true });
        if (!note) {
            throw new Error('Ghi chú không tồn tại.');
        }
        return note;
    }
    static async deleteNote(userId, id) {
        const note = await Note.findOneAndDelete({ _id: id, ownerId: userId });
        if (!note) {
            throw new Error('Ghi chú không tồn tại để xóa.');
        }
        return true;
    }
    static async generateFromSession(userId, sessionId, documentId) {
        let docText = '';
        let chatHistory = [];
        if (sessionId) {
            chatHistory = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(10);
        }
        if (documentId) {
            const doc = await DocumentModel.findOne({ _id: documentId, ownerId: userId });
            if (doc?.extractedText) {
                docText = doc.extractedText;
            }
        }
        const aiSummary = await AiService.summarizeToNote({
            documentText: docText,
            chatHistory,
        });
        const note = await Note.create({
            ownerId: userId,
            documentId: documentId || null,
            sourceType: 'ai_generated',
            title: aiSummary.title,
            content: aiSummary.content,
            aiKeyTakeaways: aiSummary.keyTakeaways,
            cases: aiSummary.cases || [],
            tags: ['#AITongHop', '#KienThucMoi'],
            linkedFlashcardIds: [],
        });
        return note;
    }
    static async convertToFlashcards(userId, noteId) {
        const note = await Note.findOne({ _id: noteId, ownerId: userId });
        if (!note) {
            throw new Error('Ghi chú không tồn tại.');
        }
        const deck = await FlashcardDeck.create({
            ownerId: userId,
            documentId: note.documentId || null,
            title: `Flashcards từ Ghi chú: ${note.title}`,
            description: `Được trích xuất tự động từ smart note vào lúc ${new Date().toLocaleDateString('vi-VN')}`,
            cardCount: 0,
        });
        const createdCardIds = [];
        // Create cards from cases if available
        if (note.cases && note.cases.length > 0) {
            for (const c of note.cases) {
                const card = await Flashcard.create({
                    deckId: deck._id,
                    documentId: note.documentId || null,
                    term: c.title,
                    definition: `${c.description}. Ví dụ: ${c.example || ''}`,
                    difficulty: 'medium',
                    easeFactor: 2.5,
                    intervalDays: 0,
                    dueDate: new Date(),
                    status: 'new',
                });
                createdCardIds.push(card._id);
            }
        }
        // Create cards from takeaways
        if (note.aiKeyTakeaways && note.aiKeyTakeaways.length > 0) {
            for (const [idx, t] of note.aiKeyTakeaways.entries()) {
                const card = await Flashcard.create({
                    deckId: deck._id,
                    documentId: note.documentId || null,
                    term: `Ý trọng tâm #${idx + 1}`,
                    definition: t,
                    difficulty: 'easy',
                    easeFactor: 2.5,
                    intervalDays: 0,
                    dueDate: new Date(),
                    status: 'new',
                });
                createdCardIds.push(card._id);
            }
        }
        deck.cardCount = createdCardIds.length;
        await deck.save();
        note.linkedFlashcardIds = createdCardIds;
        await note.save();
        return {
            deck,
            cardCount: createdCardIds.length,
        };
    }
}
