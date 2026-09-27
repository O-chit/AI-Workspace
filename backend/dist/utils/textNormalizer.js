/**
 * Bộ lọc chuẩn hóa văn bản (Text Normalizer)
 * Chuẩn hóa Unicode NFC, xử lý dấu tiếng Việt, loại bỏ ký tự rác/nhị phân,
 * chuẩn hóa khoảng trắng, dấu câu và định dạng văn bản cho upload tài liệu và câu trả lời AI.
 */
export class TextNormalizer {
    /**
     * Bộ lọc văn bản khi trích xuất tài liệu (PDF, DOCX, TXT)
     */
    static normalizeDocumentText(rawText) {
        if (!rawText || typeof rawText !== 'string') {
            return '';
        }
        let text = rawText;
        // 1. Chuẩn hóa Unicode về dạng NFC (Canonical Composition) - Cực kỳ quan trọng cho tiếng Việt
        text = text.normalize('NFC');
        // 2. Thay thế các ligature phổ biến từ PDF (ﬀ, ﬁ, ﬂ, ﬃ, ﬄ, œ, æ)
        const ligatures = {
            'ﬀ': 'ff',
            'ﬁ': 'fi',
            'ﬂ': 'fl',
            'ﬃ': 'ffi',
            'ﬄ': 'ffl',
            'œ': 'oe',
            'æ': 'ae',
            'ﬆ': 'st',
        };
        text = text.replace(/[ﬀﬁﬂﬃﬄœæﬆ]/g, (char) => ligatures[char] || char);
        // 3. Loại bỏ ký tự điều khiển (control characters) và null bytes ngoại trừ \n và \t
        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200D\uFEFF]/g, '');
        // 4. Chuẩn hóa ngắt dòng: \r\n hoặc \r về \n đơn nhất
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        // 5. Nối từ/âm tiết bị gãy do dấu gạch nối xuống dòng trong file sách/PDF (ví dụ: "giáo-\n trình" -> "giáo trình")
        text = text.replace(/([a-zA-ZÀ-ỹ0-9]+)-\s*\n\s*([a-zA-ZÀ-ỹ0-9]+)/gu, '$1 $2');
        // 6. Chuẩn hóa dấu ngoặc kép và ngoặc đơn thông minh về dạng chuẩn
        text = text
            .replace(/[“”„‟«»]/g, '"')
            .replace(/[‘’‚‛]/g, "'")
            .replace(/[—–―]/g, ' - ');
        // 7. Chuẩn hóa dấu câu: loại bỏ khoảng trắng thừa trước dấu câu (, . ; : ! ?)
        text = text.replace(/\s+([.,;:!?])/g, '$1');
        // 8. Đảm bảo có khoảng trắng sau dấu câu nếu theo sau là chữ cái tiếng Việt hoặc tiếng Anh
        text = text.replace(/([.,;:!?])([a-zA-ZÀ-ỹ])/gu, '$1 $2');
        // 9. Xóa khoảng trắng thừa ở cuối mỗi dòng
        text = text
            .split('\n')
            .map((line) => line.replace(/[ \t]+$/g, ''))
            .join('\n');
        // 10. Gom các khoảng trắng ngang liên tiếp thành 1 khoảng trắng duy nhất
        text = text.replace(/[ \t]{2,}/g, ' ');
        // 11. Gom các dòng trống liên tiếp (nhiều hơn 2 dòng trống liên tiếp thu gọn thành 2 dòng trống)
        text = text.replace(/\n{3,}/g, '\n\n');
        return text.trim();
    }
    /**
     * Bộ lọc văn bản khi AI trả lời câu hỏi
     * Đảm bảo cấu trúc câu, dấu câu, Unicode NFC và loại bỏ rác markdown thừa
     */
    static normalizeAiResponse(rawText) {
        if (!rawText || typeof rawText !== 'string') {
            return '';
        }
        let text = rawText.trim();
        // 1. Chuẩn hóa Unicode NFC
        text = text.normalize('NFC');
        // 2. Loại bỏ code block wrappers nếu AI vô tình bọc toàn bộ câu trả lời bằng ```markdown ... ``` hoặc ```json ... ```
        text = text.replace(/^```(?:markdown|json|text)?\s*\n?([\s\S]*?)\n?\s*```$/i, '$1').trim();
        // 3. Loại bỏ ký tự rác ẩn / zero-width characters
        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200D\uFEFF]/g, '');
        // 4. Chuẩn hóa xuống dòng
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        // 5. Chuẩn hóa dấu câu chuẩn tiếng Việt (không cách trước dấu câu, có cách sau dấu câu)
        text = text.replace(/\s+([.,;:!?])/g, '$1');
        text = text.replace(/([.,;:!?])([a-zA-ZÀ-ỹ])/gu, '$1 $2');
        // 6. Gom khoảng trắng dư thừa
        text = text.replace(/[ \t]{2,}/g, ' ');
        text = text.replace(/\n{3,}/g, '\n\n');
        // 7. Xóa khoảng trắng ở đuôi dòng
        text = text
            .split('\n')
            .map((line) => line.trimEnd())
            .join('\n');
        return text.trim();
    }
    /**
     * Chuẩn hóa từ khóa tìm kiếm (bỏ ký tự lạ, giữ chữ có dấu chuẩn)
     */
    static normalizeSearch(query) {
        if (!query)
            return '';
        return query
            .normalize('NFC')
            .replace(/[\x00-\x1F\x7F]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    /**
     * Khôi phục tên tệp tiếng Việt nếu bị Busboy / Multer giải mã nhầm sang latin1
     */
    static fixUtf8FileName(fileName) {
        if (!fileName)
            return '';
        try {
            const converted = Buffer.from(fileName, 'latin1').toString('utf8');
            if (converted !== fileName && !converted.includes('\uFFFD')) {
                return converted;
            }
        }
        catch { }
        return fileName;
    }
    /**
     * Trích xuất và chuẩn hóa tiêu đề thông minh khi nhập tài liệu PDF / DOCX
     * Ưu tiên:
     * 1. Tiêu đề do người dùng chỉ định
     * 2. Tiêu đề nhúng trong thuộc tính PDF (Metadata Title)
     * 3. Tên tệp gốc được làm sạch (loại bỏ đuôi .pdf, chuyển _ và - thành khoảng trắng, khôi phục UTF-8)
     * 4. Dòng văn bản tiêu đề đầu tiên từ nội dung PDF nếu tên tệp là dạng scan/mã vô nghĩa
     */
    static cleanDocumentTitle(params) {
        // 1. Nếu người dùng tự đặt tiêu đề cụ thể, ưu tiên số 1
        if (params.userTitle && params.userTitle.trim()) {
            return this.normalizeDocumentText(params.userTitle.trim());
        }
        // 2. Nếu có tiêu đề nhúng trong metadata PDF hợp lệ
        if (params.embeddedTitle && params.embeddedTitle.trim()) {
            let clean = params.embeddedTitle
                .replace(/^(Microsoft Word|WPS Office|PowerPoint|Adobe InDesign)\s*-\s*/i, '')
                .replace(/\.(pdf|docx|doc|pptx|ppt)$/i, '')
                .replace(/[_-]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (clean.length >= 3 &&
                clean.length <= 120 &&
                !/^(untitled|document\d*|scan\d*|page\s*\d*|untitled\s*\d*)$/i.test(clean)) {
                return this.normalizeDocumentText(clean);
            }
        }
        // 3. Xử lý tên tệp gốc
        if (params.originalName) {
            let name = this.fixUtf8FileName(params.originalName);
            // Loại bỏ phần mở rộng tệp (.pdf, .docx, ...)
            name = name.replace(/\.[^/.]+$/, '');
            // Chuyển dấu gạch dưới và gạch nối thành khoảng cách
            name = name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
            // Nếu tên file có nghĩa (không phải dạng scan_001 hay file123)
            if (name.length >= 3 &&
                !/^(scan\s*\d*|doc\s*\d*|file\s*\d*|document\s*\d*|untitled\s*\d*)$/i.test(name)) {
                return this.normalizeDocumentText(name);
            }
        }
        // 4. Fallback: Lấy dòng tiêu đề đầu tiên từ nội dung tài liệu PDF
        if (params.firstTextLine) {
            const line = params.firstTextLine.trim();
            if (line.length >= 4 && line.length <= 100) {
                return this.normalizeDocumentText(line);
            }
        }
        return 'Tài liệu học tập';
    }
}
