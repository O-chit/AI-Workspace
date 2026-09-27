import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../lib/axiosClient.js';
import { queryKeys } from '../lib/queryKeys.js';
import { useSessionStore } from '../stores/sessionStore.js';
import { InsightCardGroup } from '../components/ui/InsightCardGroup.js';
import {
  ChatMessage,
  ChatSession,
  DocumentFile,
  ApiSuccess,
} from '../types/api.js';
import {
  Send,
  Paperclip,
  Mic,
  Bot,
  Flame,
  FileText,
  UploadCloud,
  CheckCircle,
  Copy,
  BookmarkPlus,
  HelpCircle,
  Eye,
  CheckCheck,
  BrainCircuit,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeSessionId, setActiveSessionId, activeDocument, setActiveDocument } = useSessionStore();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Documents from MongoDB
  const { data: docsData } = useQuery({
    queryKey: queryKeys.documents.all(),
    queryFn: async () => {
      const res = (await axiosClient.get('/documents')) as unknown as ApiSuccess<{ items: DocumentFile[] }>;
      return res.data.items;
    },
  });

  const docs = docsData || [];
  const currentDoc = activeDocument || docs[0] || null;

  useEffect(() => {
    if (!activeDocument && docs.length > 0 && docs[0]) {
      setActiveDocument(docs[0]);
    }
  }, [docs, activeDocument, setActiveDocument]);

  // 2. Fetch Sessions
  const { data: sessionsData } = useQuery({
    queryKey: queryKeys.chat.sessions,
    queryFn: async () => {
      const res = (await axiosClient.get('/chat/sessions')) as unknown as ApiSuccess<ChatSession[]>;
      return res.data;
    },
  });

  const sessions = sessionsData || [];

  // Set default session if none active
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0 && sessions[0]) {
      setActiveSessionId(sessions[0]._id);
    }
  }, [sessions, activeSessionId, setActiveSessionId]);

  // 3. Fetch Messages for active session
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: activeSessionId ? queryKeys.chat.messages(activeSessionId) : ['empty-messages'],
    queryFn: async () => {
      if (!activeSessionId) return [];
      const res = (await axiosClient.get(`/chat/sessions/${activeSessionId}/messages`)) as unknown as ApiSuccess<ChatMessage[]>;
      return res.data;
    },
    enabled: !!activeSessionId,
  });

  const messages = messagesData || [];

  // 4. Fetch Suggestions grounded in MongoDB document
  const { data: suggestionsData } = useQuery({
    queryKey: queryKeys.chat.suggestions(currentDoc?._id),
    queryFn: async () => {
      const res = (await axiosClient.post('/chat/suggestions', {
        documentId: currentDoc?._id,
      })) as unknown as ApiSuccess<string[]>;
      return res.data;
    },
    enabled: !!currentDoc,
  });

  const suggestions = suggestionsData || ['Cung cầu', 'Độ co giãn', 'Giá trần', 'Điểm cân bằng'];

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Send Message Mutation - Trao đổi dữ liệu qua Document trên MongoDB
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      let sId = activeSessionId;
      // If no session, create one first with active MongoDB documentId
      if (!sId) {
        const newSessionRes = (await axiosClient.post('/chat/sessions', {
          documentId: currentDoc?._id,
          title: text.slice(0, 30),
        })) as unknown as ApiSuccess<ChatSession>;
        sId = newSessionRes.data._id;
        setActiveSessionId(sId);
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions });
      }

      const res = (await axiosClient.post(`/chat/sessions/${sId}/messages`, {
        content: text,
        documentId: currentDoc?._id,
      })) as unknown as ApiSuccess<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
        activeDocument?: DocumentFile;
      }>;
      return res.data;
    },
    onSuccess: (data) => {
      if (activeSessionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(activeSessionId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
      if (data.activeDocument && (!activeDocument || activeDocument._id !== data.activeDocument._id)) {
        setActiveDocument(data.activeDocument);
      }
    },
  });

  // 6. Upload Mutation - Tải lên ngay lập tức, không qua useState
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = (await axiosClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })) as unknown as ApiSuccess<DocumentFile>;
      return res.data;
    },
    onSuccess: (newDoc) => {
      setActiveDocument(newDoc);

      // Cập nhật ngay lập tức vào React Query cache (0ms delay)
      queryClient.setQueriesData({ queryKey: ['documents'] }, (old: any) => {
        if (!old) return [newDoc];
        if (Array.isArray(old)) return [newDoc, ...old];
        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            total: (old.total || 0) + 1,
            items: [newDoc, ...old.items],
          };
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Tải tài liệu thất bại.');
    },
  });

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || sendMessageMutation.isPending) return;
    setInputText('');
    sendMessageMutation.mutate(text.trim());
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNote = async (content: string, title?: string) => {
    try {
      await axiosClient.post('/notes', {
        documentId: currentDoc?._id,
        title: title || `Ghi chú từ hội thoại (${new Date().toLocaleTimeString('vi-VN')})`,
        content,
        tags: ['#HoiDapAI'],
      });
      alert('Đã lưu thành công vào Sổ tay!');
    } catch {
      alert('Không thể lưu vào sổ tay.');
    }
  };

  // Upload ngay lập tức khi file được chọn
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="w-full px-4 md:px-space-lg py-space-md">
      <div className="grid grid-cols-12 gap-space-lg max-w-[1560px] mx-auto w-full items-start">
        {/* LEFT COLUMN: Context & Document Tools */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-20">
          {/* Active Document Card */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary-container/40">
                Đang hoạt động
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate('/documents')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                  title="Xem danh sách tài liệu"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-space-md mt-1">
              <div className="w-14 h-16 bg-surface-container-low rounded-xl flex items-center justify-center flex-shrink-0 text-primary border border-outline-variant/30 shadow-xs">
                <FileText className="w-7 h-7" />
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="font-headline-sm text-[16px] font-bold text-on-surface truncate">
                  {currentDoc?.title || 'Chưa chọn tài liệu'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-[12px] text-on-surface-variant">
                  <span>{currentDoc?.fileSizeMb || 0} MB</span>
                  <span className="text-outline-variant">•</span>
                  <span className="font-semibold text-primary">{currentDoc?.pageCount || 1} trang</span>
                  <span className="text-outline-variant">•</span>
                  <span className="flex items-center text-secondary gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                    100% Index
                  </span>
                </div>
              </div>
            </div>

            {/* MongoDB Document Selector */}
            {docs.length > 0 && (
              <div className="mt-2 pt-2 border-t border-outline-variant/20">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Chọn tài liệu đối chiếu từ MongoDB:
                </label>
                <select
                  value={currentDoc?._id || ''}
                  onChange={(e) => {
                    const selected = docs.find((d) => d._id === e.target.value);
                    if (selected) setActiveDocument(selected);
                  }}
                  className="w-full text-[12px] font-medium bg-surface-container-low border border-outline-variant/30 rounded-xl px-2.5 py-1.5 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer truncate"
                >
                  {docs.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title} ({d.fileType.toUpperCase()} - {d.pageCount || 1} trang)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Document Progress Metric Mini Bar */}
            <div className="mt-1 pt-2 border-t border-outline-variant/20 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-on-surface-variant font-medium">Tiến độ ghi nhớ</span>
                <span className="text-primary font-bold">{currentDoc?.masteryPercent || 68}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${currentDoc?.masteryPercent || 68}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Grid (2x2) */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-space-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Hành động tức thì
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSend('Tóm tắt 4 ý trọng tâm trong tài liệu này.')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-primary-fixed hover:text-on-primary-fixed transition-all text-left group border border-outline-variant/20 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-on-surface truncate">Tóm tắt ý</span>
                  <span className="text-[11px] text-on-surface-variant truncate">4 ý trọng tâm</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/flashcards')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-primary-fixed hover:text-on-primary-fixed transition-all text-left group border border-outline-variant/20 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-on-surface truncate">Flashcards</span>
                  <span className="text-[11px] text-on-surface-variant truncate">Ôn bộ thẻ</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/quiz')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-primary-fixed hover:text-on-primary-fixed transition-all text-left group border border-outline-variant/20 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs flex-shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-on-surface truncate">Trắc nghiệm</span>
                  <span className="text-[11px] text-on-surface-variant truncate">Luyện thi</span>
                </div>
              </button>

              <button
                onClick={() => handleSend('Giải thích mô hình cung cầu và đồ thị cân bằng giá.')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-primary-fixed hover:text-on-primary-fixed transition-all text-left group border border-outline-variant/20 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs flex-shrink-0">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-on-surface truncate">Giải đồ thị</span>
                  <span className="text-[11px] text-on-surface-variant truncate">Mô hình cung</span>
                </div>
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Zone - Tải lên ngay lập tức */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) uploadMutation.mutate(file);
            }}
            className={`bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-dashed ${
              uploadMutation.isPending ? 'border-primary bg-primary-container/10 animate-pulse' : 'border-outline-variant hover:border-primary/60'
            } transition-all flex flex-col items-center justify-center text-center cursor-pointer group`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc,.pptx,.txt"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-[14px] font-bold text-on-surface">
              {uploadMutation.isPending ? 'Đang tải lên ngay...' : 'Kéo thả hoặc tải tài liệu mới ngay'}
            </p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Chuẩn hóa văn bản, lập chỉ mục & sinh đề thi
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">PDF</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">DOCX</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">PPTX</span>
            </div>
          </div>

          {/* Compact Study Milestone Visual Indicator */}
          <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-container">
                <Flame className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-on-surface">Chuỗi 5 ngày học</span>
                <span className="text-[12px] text-secondary font-medium">Đạt mục tiêu tuần</span>
              </div>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-variant"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                />
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="75, 100"
                  strokeLinecap="round"
                  strokeWidth="3.2"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-on-surface">75%</span>
            </div>
          </div>
        </aside>

        {/* MAIN CHAT STREAM (Right Column) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-space-md pb-space-xl">
          {/* Welcome Light Strip */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-headline-sm text-[16px] font-bold text-on-surface">
                  Hôm nay bạn muốn học phần nào?
                </h1>
                <p className="font-body-sm text-[12px] text-on-surface-variant">
                  Trợ lý AI sẵn sàng giải thích chi tiết theo tài liệu
                </p>
              </div>
            </div>

            {/* Suggestions Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {suggestions.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(`Giải thích chi tiết về "${chip}" theo tài liệu.`)}
                  className="text-[12px] font-medium px-3 py-1 rounded-full bg-surface-container-low hover:bg-primary-fixed hover:text-primary transition-colors text-on-surface-variant border border-outline-variant/30 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Dialogue Thread */}
          <div className="flex flex-col gap-space-md min-h-[400px]">
            {messagesLoading ? (
              <div className="flex items-center justify-center p-12 text-on-surface-variant text-[14px]">
                Đang tải lịch sử trò chuyện...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 text-center gap-2">
                <Bot className="w-12 h-12 text-primary/40" />
                <h3 className="font-bold text-on-surface text-[16px]">Bắt đầu đặt câu hỏi</h3>
                <p className="text-[13px] text-on-surface-variant max-w-sm">
                  Hãy chọn một từ khóa gợi ý phía trên hoặc gõ câu hỏi để AI phân tích trực tiếp từ tài liệu của bạn.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg._id} className="flex items-start justify-end gap-space-sm self-end max-w-xl">
                      <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-tr-xs shadow-sm">
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-on-primary/70 text-[11px]">
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <CheckCheck className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                        U
                      </div>
                    </div>
                  );
                }

                // Assistant Message Bubble
                return (
                  <div key={msg._id} className="flex items-start gap-space-sm self-start w-full">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-space-sm w-full">
                      <div className="bg-surface-container-lowest p-5 rounded-2xl rounded-tl-xs shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-4">
                        {/* Header tag */}
                        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-primary">Lumina AI</span>
                            {msg.citations && msg.citations.length > 0 && (
                              <span className="text-[11px] text-outline font-medium px-2 py-0.5 rounded bg-surface-container-low">
                                Trang {msg.citations[0]?.page || 1}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-secondary text-[12px] font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Độ chính xác {msg.accuracyScore || 99}%</span>
                          </div>
                        </div>

                        {/* Text explanation */}
                        <div className="text-[14px] text-on-surface leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Reusable InsightCardGroup (3 cards as required in Section 7.1 & line 528) */}
                        {msg.structuredCards && msg.structuredCards.length > 0 && (
                          <InsightCardGroup cards={msg.structuredCards} />
                        )}

                        {/* Inline Citations - Đối chiếu dữ liệu MongoDB */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="bg-surface-container-low/70 p-3.5 rounded-xl border border-outline-variant/30 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-secondary flex items-center gap-1.5 uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5" />
                                <span>Tài liệu MongoDB: {msg.citations[0]?.documentTitle || currentDoc?.title || 'Tài liệu học tập'}</span>
                              </span>
                              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/30">
                                Trang {msg.citations[0]?.page || 1}
                              </span>
                            </div>
                            <p className="text-[12px] text-on-surface-variant italic">
                              "{msg.citations[0]?.quote}"
                            </p>
                          </div>
                        )}

                        {/* Action buttons under response */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => navigate('/quiz')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold text-[12px] hover:bg-primary-container hover:text-on-primary transition-all cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Tạo câu hỏi ôn tập</span>
                            </button>
                            <button
                              onClick={() => handleSaveToNote(msg.content)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface font-semibold text-[12px] hover:bg-surface-container transition-colors cursor-pointer"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                              <span>Lưu vào sổ tay</span>
                            </button>
                            <button
                              onClick={() => handleCopy(msg._id, msg.content)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface font-semibold text-[12px] hover:bg-surface-container transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedId === msg._id ? 'Đã chép' : 'Sao chép'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {sendMessageMutation.isPending && (
              <div className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-2xl w-fit shadow-xs">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-[13px] text-on-surface-variant font-medium">
                  Lumina AI đang truy vấn tài liệu từ MongoDB và tổng hợp câu trả lời chuẩn...
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Floating Pill Chat Input Bar */}
          <div className="sticky bottom-2 bg-surface-container-lowest p-2 rounded-2xl shadow-elevation-2 border border-outline-variant/40 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc,.pptx,.txt"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex-shrink-0 disabled:opacity-50 cursor-pointer"
              title="Tải lên tài liệu ngay lập tức"
            >
              {uploadMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Đặt câu hỏi về tài liệu, công thức, quy luật hoặc case study..."
              className="flex-1 bg-transparent px-2 text-[14px] text-on-surface placeholder:text-outline focus:outline-none"
            />

            <button
              title="Nhập giọng nói"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors hidden sm:flex flex-shrink-0"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || sendMessageMutation.isPending}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/30 hover:bg-primary-container transition-all flex-shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
