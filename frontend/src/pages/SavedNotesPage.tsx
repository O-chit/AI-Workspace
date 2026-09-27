import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../lib/axiosClient.js';
import { queryKeys } from '../lib/queryKeys.js';
import { InsightCardGroup } from '../components/ui/InsightCardGroup.js';
import { Note, ApiSuccess } from '../types/api.js';
import {
  FileText,
  Search,
  Plus,
  Star,
  Sparkles,
  Layers,
  HelpCircle,
  Pin,
  Calendar,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SavedNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [personalText, setPersonalText] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // 1. Fetch Notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: queryKeys.notes.all({ search, tag: selectedTag }),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params['search'] = search;
      if (selectedTag) params['tag'] = selectedTag;

      const res = (await axiosClient.get('/notes', { params })) as unknown as ApiSuccess<Note[]>;
      return res.data;
    },
  });

  const notes = notesData || [];
  const currentNote = notes.find((n) => n._id === activeNoteId) || notes[0] || null;

  useEffect(() => {
    if (!activeNoteId && notes.length > 0 && notes[0]) {
      setActiveNoteId(notes[0]._id);
    }
  }, [notes, activeNoteId]);

  useEffect(() => {
    if (currentNote) {
      setPersonalText(currentNote.personalNotes || '');
    }
  }, [currentNote]);

  // 2. Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const res = (await axiosClient.post('/notes', {
        title: 'Ghi chú mới',
        content: 'Bắt đầu viết nội dung ghi chú hoặc sử dụng AI để tổng hợp...',
        tags: ['#GhiChuMoi'],
      })) as unknown as ApiSuccess<Note>;
      return res.data;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all() });
      setActiveNoteId(newNote._id);
    },
  });

  // 3. Update Note (Auto-save personal notes)
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Note> }) => {
      const res = (await axiosClient.patch(`/notes/${id}`, data)) as unknown as ApiSuccess<Note>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all() });
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    },
  });

  // 4. Convert Note to Flashcards
  const convertMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const res = (await axiosClient.post(`/notes/${noteId}/convert-to-flashcards`)) as unknown as ApiSuccess<any>;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.decks });
      alert('Đã trích xuất và tạo bộ Flashcard mới từ ghi chú thành công!');
      navigate('/flashcards');
    },
  });

  // 5. AI Generate from Session
  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = (await axiosClient.post('/notes/generate-from-session', {})) as unknown as ApiSuccess<Note>;
      return res.data;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all() });
      setActiveNoteId(newNote._id);
      alert('Lumina AI đã tổng hợp ghi chú thông minh mới!');
    },
  });

  const filterChips = ['#KinhTe', '#Toan', '#ThucTe', '#XacSuat', '#ChienLuoc'];

  return (
    <div className="w-full max-w-[1560px] mx-auto px-4 md:px-space-lg py-space-md flex flex-col gap-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] font-bold text-on-surface tracking-tight">
            Sổ tay & Ghi chú Thông minh
          </h1>
          <p className="font-body-md text-[14px] text-on-surface-variant mt-1">
            Tổng hợp tri thức cá nhân hóa, AI key takeaways và liên kết thẻ ghi nhớ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => aiGenerateMutation.mutate()}
            disabled={aiGenerateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[13px] border border-outline-variant/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Tổng hợp ghi chú tuần</span>
          </button>

          <button
            onClick={() => createNoteMutation.mutate()}
            disabled={createNoteMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[14px] shadow-md shadow-primary/25 hover:bg-primary-container transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo ghi chú mới</span>
          </button>
        </div>
      </div>

      {/* Search and Tag Chips */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-elevation-1 border border-outline-variant/30">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề, nội dung, hoặc tag..."
            className="w-full pl-10 pr-4 py-2 text-[14px] rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
              selectedTag === null
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            Tất cả
          </button>
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedTag(selectedTag === chip ? null : chip)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === chip
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Recent Notes List (col-span-12 lg:col-span-4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
              Danh sách ghi chú ({notes.length})
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant text-[13px]">
              Đang tải danh sách ghi chú...
            </div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-on-surface-variant text-[13px]">
              Chưa có ghi chú nào. Hãy bấm "Tạo ghi chú mới" hoặc nhờ AI tổng hợp!
            </div>
          ) : (
            notes.map((note) => {
              const isActive = note._id === currentNote?._id;
              return (
                <div
                  key={note._id}
                  onClick={() => setActiveNoteId(note._id)}
                  className={`p-space-md rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-surface-container-lowest border-primary shadow-elevation-1'
                      : 'bg-surface-container-lowest/80 border-outline-variant/30 hover:bg-surface-container-lowest hover:border-outline-variant'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNoteMutation.mutate({
                          id: note._id,
                          data: { isPinned: !note.isPinned },
                        });
                      }}
                      className="text-outline-variant hover:text-amber-500"
                    >
                      <Star className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  <h3 className="font-headline-sm text-[15px] font-bold text-on-surface line-clamp-1 mb-1">
                    {note.title}
                  </h3>

                  <p className="text-[12px] text-on-surface-variant line-clamp-2 mb-2 leading-relaxed">
                    {note.content || note.personalNotes || 'Chưa có nội dung chi tiết...'}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.tags?.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Active Smart Note View (col-span-12 lg:col-span-8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-md">
          {!currentNote ? (
            <div className="p-16 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 text-on-surface-variant text-[14px]">
              Vui lòng chọn một ghi chú để xem chi tiết.
            </div>
          ) : (
            <article className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-6">
              {/* Header and Actions */}
              <div className="flex flex-col gap-3 pb-3 border-b border-outline-variant/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container">
                      Kinh tế Vi mô
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="text-[12px] text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(currentNote.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => convertMutation.mutate(currentNote._id)}
                      disabled={convertMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-fixed text-on-primary-fixed hover:bg-primary hover:text-on-primary font-semibold text-[12px] transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Chuyển thành Flashcards</span>
                    </button>

                    <button
                      onClick={() => navigate('/quiz')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[12px] transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                      <span>Tạo đề thi từ ghi chú</span>
                    </button>
                  </div>
                </div>

                <h1 className="font-headline-lg text-[22px] md:text-[26px] font-bold text-on-surface leading-snug">
                  {currentNote.title}
                </h1>
              </div>

              {/* AI Key Takeaways Block */}
              {currentNote.aiKeyTakeaways && currentNote.aiKeyTakeaways.length > 0 && (
                <div className="p-5 rounded-2xl bg-primary-fixed/25 border border-primary/20 flex flex-col gap-2.5">
                  <span className="text-[12px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    AI Key Takeaways (Ý trọng tâm)
                  </span>
                  <ul className="list-disc list-inside space-y-1.5 text-[13px] text-on-surface leading-relaxed">
                    {currentNote.aiKeyTakeaways.map((point, idx) => (
                      <li key={idx} className="font-medium">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Content Markdown */}
              <div className="text-[14px] text-on-surface leading-relaxed whitespace-pre-wrap">
                {currentNote.content}
              </div>

              {/* Reusable InsightCardGroup (3 cards as required in Section 7.5 & line 528) */}
              {currentNote.cases && currentNote.cases.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-on-surface uppercase tracking-wider">
                    Các trường hợp & Mô hình phân loại tiêu biểu:
                  </span>
                  <InsightCardGroup cards={currentNote.cases} />
                </div>
              )}

              {/* Personal Notes (Yellow Paper Notepad Box) */}
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Pin className="w-3.5 h-3.5 text-amber-700" />
                    Ghi chú cá nhân của bạn
                  </span>
                  {isSavedNotice && (
                    <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Đã tự động lưu
                    </span>
                  )}
                </div>

                <textarea
                  value={personalText}
                  onChange={(e) => setPersonalText(e.target.value)}
                  onBlur={() => {
                    updateNoteMutation.mutate({
                      id: currentNote._id,
                      data: { personalNotes: personalText },
                    });
                  }}
                  rows={3}
                  placeholder="Thêm lưu ý cá nhân, mẹo nhớ khi đi thi... Hệ thống sẽ tự động lưu khi bạn dừng gõ."
                  className="w-full bg-transparent text-[13px] text-amber-950 placeholder:text-amber-700/50 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Linked Document & Resources Footer */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[12px] text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Liên kết tài liệu gốc: <strong>Kinh_te_Vi_mo_Chuong_3.pdf</strong></span>
                </div>
                <button
                  onClick={() => navigate('/assistant')}
                  className="text-primary font-semibold hover:underline"
                >
                  Tra cứu lại tài liệu →
                </button>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};
