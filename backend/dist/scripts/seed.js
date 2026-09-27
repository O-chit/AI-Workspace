import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { ChatSession } from '../models/ChatSession.model.js';
import { ChatMessage } from '../models/ChatMessage.model.js';
import { FlashcardDeck } from '../models/FlashcardDeck.model.js';
import { Flashcard } from '../models/Flashcard.model.js';
import { QuizAttempt } from '../models/QuizAttempt.model.js';
import { QuizQuestion } from '../models/QuizQuestion.model.js';
import { Note } from '../models/Note.model.js';
import { logger } from '../utils/logger.js';
async function seed() {
    await connectDB();
    logger.info('🌱 Starting database seeding for Lumina AI...');
    // Clear existing collections
    await Promise.all([
        User.deleteMany({}),
        DocumentModel.deleteMany({}),
        ChatSession.deleteMany({}),
        ChatMessage.deleteMany({}),
        FlashcardDeck.deleteMany({}),
        Flashcard.deleteMany({}),
        QuizAttempt.deleteMany({}),
        QuizQuestion.deleteMany({}),
        Note.deleteMany({}),
    ]);
    // 1. Create Demo User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);
    const demoUser = await User.create({
        email: 'demo@lumina.edu.vn',
        passwordHash,
        name: 'Nguyễn Minh Đức',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        plan: 'pro',
        storageUsedMb: 1420,
        storageLimitMb: 5000,
    });
    logger.info(`👤 Demo user created: ${demoUser.email} / 123456`);
    // 2. Create Documents
    const docMacro = await DocumentModel.create({
        ownerId: demoUser._id,
        title: 'Kinh_te_Vi_mo_Chuong_3.pdf',
        originalName: 'Kinh_te_Vi_mo_Chuong_3.pdf',
        fileType: 'pdf',
        fileSizeMb: 18.4,
        pageCount: 42,
        storageUrl: '/uploads/sample-macroeconomics.pdf',
        extractedText: `GIÁO TRÌNH KINH TẾ VI MÔ — CHƯƠNG 3: LÝ THUYẾT CUNG CẦU VÀ ĐỘ CO GIÃN
I. QUY LUẬT CẦU (LAW OF DEMAND)
Định nghĩa: Trong điều kiện các yếu tố khác không đổi (ceteris paribus), khi giá của một hàng hóa tăng lên thì lượng cầu đối với hàng hóa đó sẽ giảm xuống, và ngược lại.
Biểu diễn hình học: Đường cầu thường dốc xuống từ trái sang phải.
Hàm số cầu: Qd = a - bP (với b > 0).

II. QUY LUẬT CUNG (LAW OF SUPPLY)
Định nghĩa: Trong điều kiện các yếu tố khác không đổi, khi giá của hàng hóa tăng lên thì lượng cung cấp của hàng hóa đó trên thị trường sẽ tăng lên.
Biểu diễn hình học: Đường cung thường dốc lên từ trái sang phải.
Hàm số cung: Qs = -c + dP (với d > 0).

III. TRẠNG THÁI CÂN BẰNG THỊ TRƯỜNG (MARKET EQUILIBRIUM)
Thị trường đạt trạng thái cân bằng tại mức giá P* sao cho lượng cầu bằng lượng cung: Qd(P*) = Qs(P*).
Tại điểm này không xảy ra tình trạng dư thừa hàng hóa hay thiếu hụt hàng hóa.

IV. ĐỘ CO GIÃN CỦA CẦU THEO GIÁ (PED - PRICE ELASTICITY OF DEMAND)
Công thức: PED = (% Thay đổi của Lượng Cầu) / (% Thay đổi của Mức Giá) = (%ΔQd) / (%ΔP).
Các trường hợp:
1. |PED| > 1: Cầu co giãn nhiều (Elastic). Ví dụ: Hàng xa xỉ, vé máy bay du lịch.
2. |PED| < 1: Cầu co giãn ít (Inelastic). Ví dụ: Xăng dầu, muối, gạo, thuốc men.
3. |PED| = 1: Cầu co giãn đơn vị (Unitary elastic).
4. |PED| = 0: Cầu hoàn toàn không co giãn.
5. |PED| = vô cùng: Cầu co giãn hoàn toàn.`,
        indexStatus: 'indexed',
        masteryPercent: 68,
        tags: ['Kinh Tế', 'PDF', 'Đã tóm tắt AI'],
        summary: 'Chương 3 trình bày các quy luật cơ bản về Cung Cầu, điểm cân bằng thị trường và công thức tính Hệ số co giãn PED.',
    });
    const docPhil = await DocumentModel.create({
        ownerId: demoUser._id,
        title: 'Triet_hoc_Mac_Lenin_Giao_trinh.pdf',
        originalName: 'Triet_hoc_Mac_Lenin_Giao_trinh.pdf',
        fileType: 'pdf',
        fileSizeMb: 12.1,
        pageCount: 88,
        storageUrl: '/uploads/sample-philosophy.pdf',
        extractedText: 'Nội dung giáo trình Triết học Mác Lênin về quy luật mâu thuẫn, quy luật lượng đổi chất đổi và phủ định của phủ định.',
        indexStatus: 'indexed',
        masteryPercent: 45,
        tags: ['Đại Cương', 'PDF', 'Chưa thi'],
        summary: '3 quy luật cơ bản của phép biện chứng duy vật.',
    });
    const docStats = await DocumentModel.create({
        ownerId: demoUser._id,
        title: 'Xac_suat_Thong_ke_Ung_dung.docx',
        originalName: 'Xac_suat_Thong_ke_Ung_dung.docx',
        fileType: 'docx',
        fileSizeMb: 6.5,
        pageCount: 30,
        storageUrl: '/uploads/sample-statistics.docx',
        extractedText: 'Biến ngẫu nhiên rời rạc, biến ngẫu nhiên liên tục, phân phối chuẩn và kiểm định giả thuyết thống kê t-test, z-test.',
        indexStatus: 'indexed',
        masteryPercent: 82,
        tags: ['Toán Ứng Dụng', 'DOCX', 'Đã tóm tắt AI'],
        summary: 'Kiến thức cốt lõi về phân phối xác suất và kiểm định giả thuyết.',
    });
    logger.info('📚 Documents created.');
    // 3. Create Chat Session & Messages
    const chatSession = await ChatSession.create({
        ownerId: demoUser._id,
        documentId: docMacro._id,
        title: 'Quy luật Cung Cầu & Hệ số PED',
        aiModel: 'gemini-3.5-flash-lite',
        lastMessageAt: new Date(),
    });
    await ChatMessage.create({
        sessionId: chatSession._id,
        role: 'user',
        content: 'Tóm tắt 3 quy luật cung cầu chính trong tài liệu và cho ví dụ thực tế ngắn gọn.',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
    });
    await ChatMessage.create({
        sessionId: chatSession._id,
        role: 'assistant',
        content: 'Dưới đây là 3 quy luật nền tảng trong tài liệu Kinh tế Vi mô Chương 3 được tổng hợp kèm ví dụ thực tiễn sinh động:',
        citations: [
            {
                documentId: docMacro._id.toString(),
                page: 14,
                quote: 'Trong điều kiện các yếu tố khác không đổi, khi giá của một hàng hóa tăng lên thì lượng cầu giảm xuống...',
            },
        ],
        structuredCards: [
            {
                title: 'Quy luật Cầu',
                description: 'Giá tăng → Lượng cầu giảm và ngược lại (ceteris paribus).',
                example: 'Vé máy bay lễ Tết tăng cao, lượng người chọn tàu hỏa và xe khách tăng.',
                tag: 'Quy luật 1',
            },
            {
                title: 'Quy luật Cung',
                description: 'Giá tăng → Nhà sản xuất mở rộng lượng cung ứng ra thị trường.',
                example: 'Giá sầu riêng xuất khẩu tăng kỷ lục, nông dân chuyển dịch diện tích canh tác.',
                tag: 'Quy luật 2',
            },
            {
                title: 'Giá cân bằng',
                description: 'Giao điểm nơi Lượng cung (Qs) bằng đúng Lượng cầu (Qd).',
                example: 'Thị trường xăng dầu thế giới tự động điều chỉnh về điểm cân bằng giá.',
                tag: 'Quy luật 3',
            },
        ],
        accuracyScore: 99,
        createdAt: new Date(Date.now() - 1000 * 60 * 4),
    });
    logger.info('💬 Chat session and messages created.');
    // 4. Create Flashcard Deck & SRS Cards
    const deck = await FlashcardDeck.create({
        ownerId: demoUser._id,
        documentId: docMacro._id,
        title: 'Kinh tế Vi mô — Chương 3: Cung & Cầu',
        description: 'Bộ thẻ trích xuất tự động bằng AI gồm thuật ngữ, công thức và độ co giãn PED',
        cardCount: 3,
    });
    await Flashcard.create([
        {
            deckId: deck._id,
            documentId: docMacro._id,
            term: 'Độ co giãn của Cầu theo Giá (PED)',
            definition: 'Thước đo phản ứng của lượng người tiêu dùng muốn mua đối với sự thay đổi của giá cả thị trường khi các yếu tố khác không đổi.',
            formula: 'PED = % Δ Lượng cầu (Qd) / % Δ Mức giá (P)',
            difficulty: 'medium',
            easeFactor: 2.5,
            intervalDays: 3,
            dueDate: new Date(),
            reviewCount: 2,
            status: 'learning',
            isBookmarked: true,
        },
        {
            deckId: deck._id,
            documentId: docMacro._id,
            term: 'Quy luật Cung (Law of Supply)',
            definition: 'Khi giá hàng hóa tăng, nhà sản xuất sẽ sẵn sàng cung ứng nhiều hàng hóa hơn ra thị trường trong điều kiện các yếu tố khác không đổi.',
            formula: 'Qs = -c + dP (d > 0)',
            difficulty: 'easy',
            easeFactor: 2.65,
            intervalDays: 7,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            reviewCount: 3,
            status: 'mastered',
            isBookmarked: false,
        },
        {
            deckId: deck._id,
            documentId: docMacro._id,
            term: 'Giá Cân Bằng (Equilibrium Price)',
            definition: 'Mức giá tại đó lượng cung của người bán bằng chính xác lượng cầu của người mua, thị trường không dư thừa hay thiếu hụt.',
            formula: 'Qd(P*) = Qs(P*)',
            difficulty: 'medium',
            easeFactor: 2.3,
            intervalDays: 1,
            dueDate: new Date(),
            reviewCount: 1,
            status: 'learning',
            isBookmarked: false,
        },
    ]);
    logger.info('🎴 Flashcard deck and SRS cards created.');
    // 5. Create Quiz Attempt & Questions
    const quiz = await QuizAttempt.create({
        ownerId: demoUser._id,
        documentId: docMacro._id,
        title: 'Kiểm tra Đánh giá Năng lực: Cung Cầu & PED (Chương 3)',
        totalQuestions: 2,
        answeredCount: 1,
        correctCount: 1,
        durationSeconds: 145,
        status: 'in_progress',
        aiPredictedAccuracy: 100,
    });
    await QuizQuestion.create([
        {
            attemptId: quiz._id,
            order: 1,
            prompt: 'Khi giá của mặt hàng X tăng 10%, lượng cầu mặt hàng X giảm 25%. Hệ số co giãn của cầu theo giá (PED) là bao nhiêu và đây là loại cầu gì?',
            formulaHint: 'PED = %ΔQ / %ΔP',
            topic: 'Chuyên đề: Cầu & Độ co giãn của giá (PED)',
            options: [
                { key: 'A', text: 'PED = -0.4; Cầu ít co giãn (Inelastic)' },
                { key: 'B', text: 'PED = -2.5; Cầu co giãn nhiều (Elastic)' },
                { key: 'C', text: 'PED = -1.0; Cầu co giãn đơn vị (Unitary)' },
                { key: 'D', text: 'PED = -1.5; Cầu hoàn toàn không co giãn' },
            ],
            correctKey: 'B',
            explanation: '|PED| = |-25% / 10%| = 2.5 > 1. Do độ lớn tuyệt đối lớn hơn 1, cầu được xếp vào loại co giãn nhiều (Elastic).',
            selectedKey: 'B',
            flaggedForReview: false,
            isCorrect: true,
        },
        {
            attemptId: quiz._id,
            order: 2,
            prompt: 'Điều gì sau đây sẽ làm dịch chuyển đường cung của một sản phẩm sang phải?',
            formulaHint: 'Sự thay đổi các yếu tố ngoài giá',
            topic: 'Chuyên đề: Quy luật Cung & Công nghệ',
            options: [
                { key: 'A', text: 'Giá nguyên vật liệu đầu vào tăng cao' },
                { key: 'B', text: 'Cải tiến công nghệ sản xuất giúp hạ giá thành' },
                { key: 'C', text: 'Chính phủ tăng thuế đánh vào sản phẩm' },
                { key: 'D', text: 'Số lượng nhà sản xuất trên thị trường giảm bớt' },
            ],
            correctKey: 'B',
            explanation: 'Công nghệ sản xuất tiến bộ giúp tiết kiệm chi phí, cho phép người bán cung ứng nhiều hơn ở mỗi mức giá, làm đường cung dịch chuyển sang phải.',
            selectedKey: undefined,
            flaggedForReview: true,
            isCorrect: undefined,
        },
    ]);
    logger.info('📝 Quiz attempt and questions created.');
    // 6. Create Smart Notes
    await Note.create([
        {
            ownerId: demoUser._id,
            documentId: docMacro._id,
            sourceType: 'ai_generated',
            title: '3 Quy luật Cung Cầu trong thực tế thị trường xăng dầu',
            content: `## Phân tích tác động chính sách lên thị trường nhiên liệu\n\n- **Tác động điều tiết thuế môi trường** và mức trợ cấp nhiên liệu khiến điểm cân bằng dịch chuyển sang trái.\n- Khi giá trần được áp đặt dưới giá cân bằng, hiện tượng xếp hàng chờ mua xăng dầu xuất hiện do thiếu hụt cục bộ.\n- **Độ co giãn ngắn hạn:** Người tiêu dùng khó đổi phương tiện ngay nên PED rất thấp trong ngắn hạn.`,
            aiKeyTakeaways: [
                'Xăng dầu là mặt hàng thiết yếu có |PED| < 1 trong ngắn hạn.',
                'Can thiệp giá trần luôn dẫn đến tình trạng khan hiếm nguồn cung.',
                'Chính sách thuế bảo vệ môi trường trực tiếp làm tăng chi phí biên của nhà sản xuất.',
            ],
            cases: [
                {
                    title: 'Quy luật Cầu',
                    description: 'Nhu cầu xăng dầu biến động chậm trong ngắn hạn nhưng có xu hướng chuyển sang xe điện trong dài hạn.',
                    example: 'Người dùng mua xe điện VinFast khi giá xăng tăng liên tục.',
                    tag: 'Hành vi tiêu dùng',
                },
                {
                    title: 'Quy luật Cung',
                    description: 'Các nhà máy lọc dầu điều tiết công suất theo biên lợi nhuận crack spread toàn cầu.',
                    example: 'Nghi Sơn & Dung Quất vận hành tối đa công suất khi giá thành phẩm neo cao.',
                    tag: 'Cung ứng năng lượng',
                },
                {
                    title: 'Điểm Cân Bằng',
                    description: 'Quỹ bình ổn xăng dầu đóng vai trò hấp thụ sốc để neo giữ giá trong biên độ mục tiêu.',
                    example: 'Trích lập và chi sử dụng Quỹ BOG theo chu kỳ điều hành.',
                    tag: 'Cơ chế điều tiết',
                },
            ],
            personalNotes: 'Cần ôn kỹ phần đồ thị dịch chuyển đường cung S sang trái khi thuế môi trường tăng.',
            tags: ['#KinhTe', '#ThucTe', '#XangDau'],
            linkedFlashcardIds: [],
            isPinned: true,
        },
        {
            ownerId: demoUser._id,
            documentId: docStats._id,
            sourceType: 'manual',
            title: 'Biến ngẫu nhiên rời rạc vs liên tục',
            content: `### Phân biệt hàm xác suất:\n- **Rời rạc:** Sử dụng hàm khối xác suất PMF P(X = x).\n- **Liên tục:** Sử dụng hàm mật độ xác suất PDF f(x), xác suất tại 1 điểm đơn lẻ luôn bằng 0.`,
            aiKeyTakeaways: [
                'Tích phân hàm mật độ trên toàn miền bằng 1.',
                'Kỳ vọng toán E(X) là trọng tâm của phân phối.',
            ],
            tags: ['#XacSuat', '#Toan'],
            linkedFlashcardIds: [],
            isPinned: false,
        },
    ]);
    logger.info('📒 Smart notes created.');
    logger.info('🎉 Seed completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    logger.error('❌ Seeding failed:', err);
    process.exit(1);
});
