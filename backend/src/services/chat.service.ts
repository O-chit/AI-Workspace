import { ChatSession } from '../models/ChatSession.model.js';
import { ChatMessage } from '../models/ChatMessage.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { AiService } from './ai.service.js';
import { CreateSessionInput } from '../schemas/chat.schema.js';
import { TextNormalizer } from '../utils/textNormalizer.js';

export class ChatService {
  static async getSessions(userId: string) {
    return ChatSession.find({ ownerId: userId })
      .populate('documentId', 'title fileType pageCount')
      .sort({ lastMessageAt: -1 });
  }

  static async createSession(userId: string, input: CreateSessionInput) {
    let title = input.title?.trim();
    let targetDocId = input.documentId;

    // Nếu không truyền documentId, tự động tìm tài liệu gần nhất trên MongoDB của user
    if (!targetDocId) {
      const latestDoc = await DocumentModel.findOne({ ownerId: userId }).sort({ updatedAt: -1 });
      if (latestDoc) {
        targetDocId = latestDoc._id.toString();
      }
    }

    if (targetDocId) {
      const doc = await DocumentModel.findOne({ _id: targetDocId, ownerId: userId });
      if (doc && !title) {
        title = `Hỏi đáp: ${doc.title}`;
      }
    }

    const cleanTitle = TextNormalizer.normalizeDocumentText(title || 'Phiên học mới');

    const session = await ChatSession.create({
      ownerId: userId,
      documentId: targetDocId || null,
      title: cleanTitle,
      aiModel: 'gemini-3.5-flash-lite',
      lastMessageAt: new Date(),
    });

    return session;
  }

  static async deleteSession(userId: string, sessionId: string) {
    const session = await ChatSession.findOneAndDelete({ _id: sessionId, ownerId: userId });
    if (!session) {
      throw new Error('Không tìm thấy phiên trò chuyện.');
    }
    await ChatMessage.deleteMany({ sessionId });
    return true;
  }

  static async getMessages(userId: string, sessionId: string) {
    const session = await ChatSession.findOne({ _id: sessionId, ownerId: userId });
    if (!session) {
      throw new Error('Phiên trò chuyện không tồn tại.');
    }
    return ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
  }

  static async sendMessage(userId: string, sessionId: string, content: string, explicitDocumentId?: string) {
    const session = await ChatSession.findOne({ _id: sessionId, ownerId: userId });
    if (!session) {
      throw new Error('Phiên trò chuyện không tồn tại.');
    }

    // 1. Áp dụng bộ lọc chữ về chuẩn cho câu hỏi của người dùng
    const cleanContent = TextNormalizer.normalizeDocumentText(content);

    // Lưu tin nhắn sinh viên vào MongoDB
    const userMsg = await ChatMessage.create({
      sessionId,
      role: 'user',
      content: cleanContent,
    });

    // 2. Lịch sử hội thoại gần nhất
    const history = await ChatMessage.find({ sessionId }).sort({ createdAt: -1 }).limit(6);
    const reversedHistory = history.reverse();

    // 3. Trao đổi dữ liệu trực tiếp với Documents trên MongoDB (RAG grounding)
    let targetDocId = explicitDocumentId || session.documentId?.toString();
    let targetDoc = null;

    if (targetDocId) {
      targetDoc = await DocumentModel.findOne({ _id: targetDocId, ownerId: userId });
    }

    // Nếu session chưa liên kết tài liệu cụ thể hoặc không tìm thấy, quét toàn bộ documents trên MongoDB của user
    if (!targetDoc) {
      const userDocs = await DocumentModel.find({ ownerId: userId }).sort({ updatedAt: -1 });
      if (userDocs.length > 0) {
        // Tìm tài liệu có tiêu đề hoặc từ khóa xuất hiện trong câu hỏi
        const matched = userDocs.find((d) => {
          const lowerQuestion = cleanContent.toLowerCase();
          const lowerTitle = d.title.toLowerCase();
          return lowerQuestion.includes(lowerTitle) || d.tags.some((t) => lowerQuestion.includes(t.toLowerCase()));
        });

        targetDoc = matched || userDocs[0] || null;
        if (targetDoc) {
          session.documentId = targetDoc._id;
        }
      }
    }

    let docContext = '';
    let docTitle = '';
    let docIdStr = '';

    if (targetDoc) {
      docTitle = targetDoc.title;
      docIdStr = targetDoc._id.toString();
      docContext = targetDoc.extractedText || targetDoc.summary || '';

      // Cập nhật thời điểm hoạt động học tập trên MongoDB document
      await DocumentModel.findByIdAndUpdate(targetDoc._id, {
        $set: { updatedAt: new Date() },
      });
    }

    // 4. Gọi AI xử lý ngữ cảnh với dữ liệu tài liệu MongoDB
    const aiResult = await AiService.askAboutDocument({
      sessionHistory: reversedHistory,
      question: cleanContent,
      documentContext: docContext,
      documentId: docIdStr || undefined,
      documentTitle: docTitle || undefined,
    });

    // 5. Chuẩn hóa câu trả lời và lưu vào ChatMessage trong MongoDB
    const normalizedAnswer = TextNormalizer.normalizeAiResponse(aiResult.answer);

    const assistantMsg = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: normalizedAnswer,
      citations: aiResult.citations,
      structuredCards: aiResult.structuredCards,
      accuracyScore: aiResult.accuracyScore,
    });

    // 6. Cập nhật phiên trò chuyện trong MongoDB
    session.lastMessageAt = new Date();
    if (session.title === 'Phiên học mới' || session.title.startsWith('Hỏi đáp:')) {
      const generatedTitle = docTitle ? `[${docTitle}] ${cleanContent.slice(0, 25)}` : cleanContent.slice(0, 35);
      session.title = generatedTitle + (cleanContent.length > 35 ? '...' : '');
    }
    await session.save();

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      activeDocument: targetDoc ? {
        _id: targetDoc._id,
        title: targetDoc.title,
        fileType: targetDoc.fileType,
        pageCount: targetDoc.pageCount,
      } : null,
    };
  }

  static async getSuggestions(userId: string, documentId?: string) {
    let targetDoc = null;
    if (documentId) {
      targetDoc = await DocumentModel.findOne({ _id: documentId, ownerId: userId });
    }
    if (!targetDoc) {
      targetDoc = await DocumentModel.findOne({ ownerId: userId }).sort({ updatedAt: -1 });
    }

    if (targetDoc?.extractedText) {
      return AiService.generateSuggestions(targetDoc.extractedText);
    }
    return ['Cung cầu', 'Độ co giãn', 'Giá trần', 'Điểm cân bằng', 'Hàm sản xuất'];
  }
}
