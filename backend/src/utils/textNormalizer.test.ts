import { describe, it, expect } from 'vitest';
import { TextNormalizer } from './textNormalizer.js';

describe('TextNormalizer Utility', () => {
  it('should normalize Unicode to NFC and fix decomposed Vietnamese accents', () => {
    // Decomposed form of "tiếng Việt"
    const decomposed = 'tie\u0302\u0301ng Vi\u00ea\u0323t';
    const normalized = TextNormalizer.normalizeDocumentText(decomposed);
    expect(normalized).toBe('tiếng Việt');
  });

  it('should replace ligatures and strip binary/control characters', () => {
    const raw = 'The e\uFB00ect of \u0000in\uFB02ation\u0007 on market.';
    const normalized = TextNormalizer.normalizeDocumentText(raw);
    expect(normalized).toBe('The effect of inflation on market.');
  });

  it('should fix hyphenation at line breaks in documents', () => {
    const raw = 'Đây là giáo-\n trình Kinh tế học.';
    const normalized = TextNormalizer.normalizeDocumentText(raw);
    expect(normalized).toBe('Đây là giáo trình Kinh tế học.');
  });

  it('should fix spacing around Vietnamese punctuation', () => {
    const raw = 'Quy luật cung ,cầu xác định giá cả .';
    const normalized = TextNormalizer.normalizeDocumentText(raw);
    expect(normalized).toBe('Quy luật cung, cầu xác định giá cả.');
  });

  it('should normalize AI responses by stripping markdown wrapper and excess spaces', () => {
    const aiRaw = '```markdown\nLumina AI xin giải thích :độ co giãn của cầu .\n\n\n\nNội dung tiếp theo.```';
    const normalized = TextNormalizer.normalizeAiResponse(aiRaw);
    expect(normalized).toContain('Lumina AI xin giải thích: độ co giãn của cầu.');
    expect(normalized).not.toContain('```markdown');
  });

  it('should recover UTF-8 filenames if mangled by busboy latin1 encoding', () => {
    const mangled = Buffer.from('Giáo trình Kinh tế Vi mô.pdf', 'utf8').toString('latin1');
    const recovered = TextNormalizer.fixUtf8FileName(mangled);
    expect(recovered).toBe('Giáo trình Kinh tế Vi mô.pdf');
  });

  it('should clean PDF titles from embedded metadata, filenames, and first text lines', () => {
    // 1. Embedded title in PDF
    const titleFromPdf = TextNormalizer.cleanDocumentTitle({
      originalName: 'doc_12.pdf',
      embeddedTitle: 'Microsoft Word - Giao_trinh_Kinh_te_vi_mo.docx',
    });
    expect(titleFromPdf).toBe('Giao trinh Kinh te vi mo');

    // 2. Clean filename with underscores and extension stripped
    const titleFromName = TextNormalizer.cleanDocumentTitle({
      originalName: 'Toan8_PCT5.pdf',
    });
    expect(titleFromName).toBe('Toan8 PCT5');

    // 3. Fallback to first text line when filename is generic scan
    const titleFromContent = TextNormalizer.cleanDocumentTitle({
      originalName: 'scan_001.pdf',
      firstTextLine: 'CHƯƠNG 1: TỔNG QUAN VỀ KINH TẾ HỌC',
    });
    expect(titleFromContent).toBe('CHƯƠNG 1: TỔNG QUAN VỀ KINH TẾ HỌC');

    // 4. User provided title takes priority
    const userTitle = TextNormalizer.cleanDocumentTitle({
      userTitle: 'Đề thi cuối kỳ 2024',
      originalName: 'scan_001.pdf',
    });
    expect(userTitle).toBe('Đề thi cuối kỳ 2024');
  });
});
