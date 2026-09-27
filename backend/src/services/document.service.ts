import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { DocumentModel } from '../models/Document.model.js';
import { User } from '../models/User.model.js';
import { Flashcard } from '../models/Flashcard.model.js';
import { QuizAttempt } from '../models/QuizAttempt.model.js';
import { ChatSession } from '../models/ChatSession.model.js';
import { logger } from '../utils/logger.js';
import { DocumentQueryInput } from '../schemas/document.schema.js';

import { TextNormalizer } from '../utils/textNormalizer.js';

export class DocumentService {
  /**
   * Tính Mastery % của tài liệu theo công thức trung bình có trọng số:
   * Mastery = 50% * (% Flashcard Mastered) + 50% * (% Điểm Quiz gần nhất)
   * Giúp sinh viên nắm rõ tiến độ ghi nhớ kiến thức toàn diện cả lý thuyết lẫn bài tập trắc nghiệm.
   */
  static async calculateMastery(documentId: string): Promise<number> {
    const totalCards = await Flashcard.countDocuments({ documentId });
    let cardScore = 0;
    if (totalCards > 0) {
      const masteredCards = await Flashcard.countDocuments({ documentId, status: 'mastered' });
      cardScore = (masteredCards / totalCards) * 100;
    }

    const latestQuiz = await QuizAttempt.findOne({ documentId, status: 'submitted' }).sort({ createdAt: -1 });
    let quizScore = 0;
    if (latestQuiz && latestQuiz.totalQuestions > 0) {
      quizScore = (latestQuiz.correctCount / latestQuiz.totalQuestions) * 100;
    }

    if (totalCards === 0 && !latestQuiz) {
      return 0;
    }
    if (totalCards > 0 && !latestQuiz) {
      return Math.round(cardScore);
    }
    if (totalCards === 0 && latestQuiz) {
      return Math.round(quizScore);
    }

    const weightedMastery = Math.round(0.5 * cardScore + 0.5 * quizScore);
    await DocumentModel.findByIdAndUpdate(documentId, { masteryPercent: weightedMastery });
    return weightedMastery;
  }

  static async parseFile(filePath: string, originalName: string, mimeType: string): Promise<{
    text: string;
    pageCount: number;
    fileType: 'pdf' | 'docx' | 'pptx';
    detectedTitle?: string;
  }> {
    const ext = path.extname(originalName).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    let rawText = '';
    let pageCount = 1;
    let fileType: 'pdf' | 'docx' | 'pptx' = 'pdf';
    let detectedTitle: string | undefined = undefined;

    if (ext === '.pdf' || mimeType === 'application/pdf') {
      try {
        const data = await pdfParse(buffer);
        rawText = data.text || '';
        pageCount = data.numpages || 1;
        fileType = 'pdf';

        // Trích xuất tiêu đề được nhúng trong metadata PDF (nếu có)
        if (data.info && typeof data.info.Title === 'string') {
          const rawTitle = data.info.Title.trim();
          if (rawTitle.length >= 3) {
            detectedTitle = rawTitle;
          }
        }
      } catch (err) {
        logger.error('Error parsing PDF:', err);
        rawText = '';
        pageCount = 1;
        fileType = 'pdf';
      }
    } else if (ext === '.docx' || ext === '.doc') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value || '';
        pageCount = Math.max(1, Math.ceil(rawText.length / 2500));
        fileType = 'docx';
      } catch (err) {
        logger.error('Error parsing DOCX:', err);
        rawText = '';
        pageCount = 1;
        fileType = 'docx';
      }
    } else if (ext === '.txt') {
      rawText = buffer.toString('utf-8');
      pageCount = Math.max(1, Math.ceil(rawText.length / 2500));
      fileType = 'pdf'; // group with documents
    } else {
      // Default for pptx or presentation files
      rawText = 'Nội dung tệp thuyết trình / tài liệu đính kèm.';
      pageCount = 10;
      fileType = 'pptx';
    }

    // Áp dụng bộ lọc chữ về chuẩn (Unicode NFC, loại bỏ rác, ligature, ngắt dòng)
    const normalizedText = TextNormalizer.normalizeDocumentText(rawText);

    return {
      text: normalizedText,
      pageCount,
      fileType,
      detectedTitle,
    };
  }

  static async uploadDocument(userId: string, file: Express.Multer.File, title?: string) {
    const fileSizeMb = +(file.size / (1024 * 1024)).toFixed(2);
    const { text, pageCount, fileType, detectedTitle } = await this.parseFile(file.path, file.originalname, file.mimetype);

    // Xác định tiêu đề tài liệu chuẩn xác và thẩm mỹ nhất
    const firstTextLine = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length >= 5 && l.length <= 80 && !/^(trang|page|\d+)/i.test(l));

    const cleanTitle = TextNormalizer.cleanDocumentTitle({
      userTitle: title,
      originalName: file.originalname,
      embeddedTitle: detectedTitle,
      firstTextLine,
    });

    const doc = await DocumentModel.create({
      ownerId: userId,
      title: cleanTitle,
      originalName: TextNormalizer.fixUtf8FileName(file.originalname),
      fileType,
      fileSizeMb,
      pageCount,
      storageUrl: `/uploads/${file.filename}`,
      extractedText: text,
      indexStatus: 'indexed',
      masteryPercent: 0,
      tags: ['Tài liệu mới', fileType.toUpperCase()],
    });

    // Update user storage
    await User.findByIdAndUpdate(userId, {
      $inc: { storageUsedMb: fileSizeMb },
    });

    return doc;
  }

  static async updateDocument(userId: string, id: string, updates: { title?: string; tags?: string[] }) {
    const updateData: Record<string, any> = {};
    if (updates.title) {
      updateData.title = TextNormalizer.normalizeDocumentText(updates.title);
    }
    if (updates.tags) {
      updateData.tags = updates.tags;
    }

    const doc = await DocumentModel.findOneAndUpdate(
      { _id: id, ownerId: userId },
      { $set: updateData },
      { new: true }
    );

    if (!doc) {
      throw new Error('Không tìm thấy tài liệu để cập nhật.');
    }

    return doc;
  }

  static async getDocuments(userId: string, query: DocumentQueryInput) {
    const filter: Record<string, unknown> = { ownerId: userId };

    if (query.fileType && query.fileType !== 'all') {
      filter['fileType'] = query.fileType;
    }

    if (query.tag) {
      filter['tags'] = query.tag;
    }

    if (query.search) {
      const cleanSearch = TextNormalizer.normalizeSearch(query.search);
      filter['$or'] = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { originalName: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 12);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DocumentModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      DocumentModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getDocumentById(userId: string, id: string) {
    const doc = await DocumentModel.findOne({ _id: id, ownerId: userId });
    if (!doc) {
      throw new Error('Không tìm thấy tài liệu yêu cầu.');
    }
    return doc;
  }

  static async deleteDocument(userId: string, id: string) {
    const doc = await DocumentModel.findOneAndDelete({ _id: id, ownerId: userId });
    if (!doc) {
      throw new Error('Không tìm thấy tài liệu để xóa.');
    }

    // Decrement user storage
    if (doc.fileSizeMb) {
      await User.findByIdAndUpdate(userId, {
        $inc: { storageUsedMb: -doc.fileSizeMb },
      });
    }

    return true;
  }

  static async getStats(userId: string) {
    const user = await User.findById(userId);
    const totalDocs = await DocumentModel.countDocuments({ ownerId: userId });
    const docs = await DocumentModel.find({ ownerId: userId }).select('fileSizeMb extractedText');
    
    let totalWords = 0;
    for (const d of docs) {
      if (d.extractedText) {
        totalWords += d.extractedText.split(/\s+/).length;
      }
    }

    const linkedSessionsCount = await ChatSession.countDocuments({ ownerId: userId });

    return {
      totalDocuments: totalDocs,
      storageUsedMb: user?.storageUsedMb || 0,
      storageLimitMb: user?.storageLimitMb || 5000,
      storagePercentage: user ? Math.round((user.storageUsedMb / user.storageLimitMb) * 100) : 0,
      indexedConcepts: Math.max(totalDocs * 85, Math.round(totalWords / 15)),
      linkedSessions: linkedSessionsCount,
    };
  }
}
