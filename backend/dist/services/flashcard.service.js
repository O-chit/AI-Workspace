import { FlashcardDeck } from '../models/FlashcardDeck.model.js';
import { Flashcard } from '../models/Flashcard.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { AiService } from './ai.service.js';
import { DocumentService } from './document.service.js';
export class FlashcardService {
    /**
     * Thuật toán SM-2 SRS cải tiến:
     * Tính toán easeFactor, intervalDays, dueDate và status ('new' | 'learning' | 'mastered')
     */
    static calculateNextReview(currentEaseFactor, currentInterval, rating) {
        let easeFactor = currentEaseFactor;
        let intervalDays = currentInterval;
        let status = 'learning';
        switch (rating) {
            case 'again':
                // Chưa nhớ: học lại từ đầu
                intervalDays = 1;
                easeFactor = Math.max(1.3, +(easeFactor - 0.2).toFixed(2));
                status = 'learning';
                break;
            case 'hard':
                // Khó: khoảng cách tăng chậm
                intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
                easeFactor = Math.max(1.3, +(easeFactor - 0.15).toFixed(2));
                status = 'learning';
                break;
            case 'good':
                // Tốt: khoảng cách chuẩn theo hệ số ghi nhớ
                if (intervalDays === 0) {
                    intervalDays = 1;
                }
                else if (intervalDays === 1) {
                    intervalDays = 3;
                }
                else {
                    intervalDays = Math.round(intervalDays * easeFactor);
                }
                status = intervalDays >= 7 ? 'mastered' : 'learning';
                break;
            case 'easy':
                // Dễ: khoảng cách nhảy vọt, tăng easeFactor
                if (intervalDays === 0) {
                    intervalDays = 3;
                }
                else {
                    intervalDays = Math.round(intervalDays * easeFactor * 1.3);
                }
                easeFactor = +(easeFactor + 0.15).toFixed(2);
                status = 'mastered';
                break;
        }
        const now = new Date();
        const dueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        return {
            easeFactor,
            intervalDays,
            dueDate,
            status,
        };
    }
    static async getDecks(userId) {
        return FlashcardDeck.find({ ownerId: userId })
            .populate('documentId', 'title fileType')
            .sort({ updatedAt: -1 });
    }
    static async createDeck(userId, input) {
        const deck = await FlashcardDeck.create({
            ownerId: userId,
            title: input.title,
            description: input.description || '',
            documentId: input.documentId || null,
            cardCount: 0,
        });
        return deck;
    }
    static async getDeckCards(deckId) {
        return Flashcard.find({ deckId }).sort({ createdAt: 1 });
    }
    static async generateCardsFromDoc(userId, deckId, documentId, count) {
        const deck = await FlashcardDeck.findOne({ _id: deckId, ownerId: userId });
        if (!deck) {
            throw new Error('Bộ flashcard không tồn tại.');
        }
        const doc = await DocumentModel.findOne({ _id: documentId, ownerId: userId });
        if (!doc || !doc.extractedText) {
            throw new Error('Tài liệu không có nội dung văn bản để trích xuất thẻ.');
        }
        const cardsData = await AiService.generateFlashcards({
            documentText: doc.extractedText,
            count,
        });
        const createdCards = await Promise.all(cardsData.map((c) => Flashcard.create({
            deckId: deck._id,
            documentId: doc._id,
            term: c.term,
            definition: c.definition,
            formula: c.formula || '',
            difficulty: c.difficulty || 'medium',
            easeFactor: 2.5,
            intervalDays: 0,
            dueDate: new Date(),
            reviewCount: 0,
            status: 'new',
        })));
        const totalInDeck = await Flashcard.countDocuments({ deckId: deck._id });
        deck.cardCount = totalInDeck;
        await deck.save();
        await DocumentService.calculateMastery(documentId);
        return createdCards;
    }
    static async reviewCard(userId, cardId, rating) {
        const card = await Flashcard.findById(cardId);
        if (!card) {
            throw new Error('Thẻ flashcard không tồn tại.');
        }
        const nextState = this.calculateNextReview(card.easeFactor, card.intervalDays, rating);
        card.easeFactor = nextState.easeFactor;
        card.intervalDays = nextState.intervalDays;
        card.dueDate = nextState.dueDate;
        card.status = nextState.status;
        card.reviewCount += 1;
        await card.save();
        if (card.documentId) {
            await DocumentService.calculateMastery(card.documentId.toString());
        }
        return card;
    }
    static async getDueCards(userId) {
        const decks = await FlashcardDeck.find({ ownerId: userId }).select('_id');
        const deckIds = decks.map((d) => d._id);
        return Flashcard.find({
            deckId: { $in: deckIds },
            dueDate: { $lte: new Date() },
        }).sort({ dueDate: 1 });
    }
    static async getDeckStats(deckId) {
        const total = await Flashcard.countDocuments({ deckId });
        const mastered = await Flashcard.countDocuments({ deckId, status: 'mastered' });
        const learning = await Flashcard.countDocuments({ deckId, status: 'learning' });
        const newCards = await Flashcard.countDocuments({ deckId, status: 'new' });
        return {
            total,
            mastered,
            learning,
            newCards,
            masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
        };
    }
}
