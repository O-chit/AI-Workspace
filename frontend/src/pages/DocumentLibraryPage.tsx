import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../lib/axiosClient.js';
import { queryKeys } from '../lib/queryKeys.js';
import { useSessionStore } from '../stores/sessionStore.js';
import {
  DocumentFile,
  DocumentStats,
  ApiSuccess,
} from '../types/api.js';
import {
  FolderOpen,
  Cloud,
  Brain,
  MessageSquare,
  Search,
  UploadCloud,
  TrendingUp,
  Trash2,
  Sparkles,
  Layers,
  HelpCircle,
  Plus,
} from 'lucide-react';

export const DocumentLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setActiveDocument } = useSessionStore();

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pdf' | 'docx' | 'pptx'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: queryKeys.documents.stats,
    queryFn: async () => {
      const res = (await axiosClient.get('/documents/stats')) as unknown as ApiSuccess<DocumentStats>;
      return res.data;
    },
  });

  const stats = statsData || {
    totalDocuments: 3,
    storageUsedMb: 1420,
    storageLimitMb: 5000,
    storagePercentage: 28,
    indexedConcepts: 1240,
    linkedSessions: 32,
  };

  // 2. Fetch Documents with search and filter
  const { data: docsData, isLoading } = useQuery({
    queryKey: queryKeys.documents.all({ search, fileType: selectedFilter }),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params['search'] = search;
      if (selectedFilter !== 'all') params['fileType'] = selectedFilter;

      const res = (await axiosClient.get('/documents', { params })) as unknown as ApiSuccess<{
        items: DocumentFile[];
        total: number;
      }>;
      return res.data;
    },
  });

  const documents = docsData?.items || [];

  // 3. Upload Mutation (Upload ngay lập tức khi chọn file, không qua useState)
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
        if (!old) return old;
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

      // Invalidate toàn bộ query có prefix ['documents'] để đồng bộ với server
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Không thể tải lên tài liệu. Vui lòng kiểm tra định dạng hoặc kích thước tệp.');
    },
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/documents/${id}`);
    },
    onSuccess: (_data, id) => {
      // Xóa ngay lập tức khỏi cache
      queryClient.setQueriesData({ queryKey: ['documents'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) return old.filter((d: any) => d._id !== id);
        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            total: Math.max(0, (old.total || 1) - 1),
            items: old.items.filter((d: any) => d._id !== id),
          };
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Upload ngay lập tức khi file được chọn
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleStudyWithDoc = (doc: DocumentFile) => {
    setActiveDocument(doc);
    navigate('/assistant');
  };

  const filterTabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pdf', label: 'Tệp PDF' },
    { id: 'docx', label: 'Tài liệu DOCX' },
    { id: 'pptx', label: 'Thuyết trình PPTX' },
  ];

  return (
    <div className="w-full max-w-[1560px] mx-auto px-4 md:px-space-lg py-space-md flex flex-col gap-space-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-[28px] font-bold text-on-surface tracking-tight">
            Thư viện Tài liệu
          </h1>
          <p className="font-body-md text-[14px] text-on-surface-variant mt-1">
            Quản lý giáo trình, bài giảng và tài nguyên học tập được AI lập chỉ mục
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.pptx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-[14px] shadow-md shadow-primary/25 hover:bg-primary-container transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{uploadMutation.isPending ? 'Đang tải lên ngay...' : 'Tải lên tài liệu mới'}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Banner - Kéo thả tệp tải lên ngay lập tức */}
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
          if (file) {
            uploadMutation.mutate(file);
          }
        }}
        className={`w-full p-8 rounded-3xl bg-surface-container-lowest border-2 border-dashed ${
          uploadMutation.isPending ? 'border-primary bg-primary-container/10 animate-pulse' : 'border-outline-variant hover:border-primary/60'
        } transition-all flex flex-col items-center justify-center text-center cursor-pointer group shadow-xs`}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-[16px] font-bold text-on-surface">
          {uploadMutation.isPending ? 'Đang xử lý và tải lên dữ liệu tài liệu...' : 'Kéo thả tệp hoặc bấm vào đây để tải tài liệu học tập ngay'}
        </h3>
        <p className="text-[13px] text-on-surface-variant mt-1 max-w-md">
          Tải lên tức thì PDF, Word (.docx), PowerPoint (.pptx). Tự động chuẩn hóa văn bản, trích xuất flashcard và sinh đề thi.
        </p>
      </div>

      {/* 4 Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Card 1: Total Docs */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-elevation-1 border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-on-surface-variant">Tổng tài liệu</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-on-surface tracking-tight">
              {stats.totalDocuments}
            </span>
            <span className="text-[13px] text-on-surface-variant">tệp lưu trữ</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] font-medium text-secondary">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Đã đồng bộ đầy đủ</span>
          </div>
        </div>

        {/* Card 2: Cloud Storage */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-elevation-1 border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-on-surface-variant">Dung lượng đám mây</span>
            <div className="w-9 h-9 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[24px] font-bold text-on-surface">
              {(stats.storageUsedMb / 1024).toFixed(1)} / {(stats.storageLimitMb / 1024).toFixed(1)} GB
            </span>
            <span className="text-[11px] font-bold text-secondary px-2 py-0.5 rounded-full bg-secondary-container/30">
              {stats.storagePercentage}%
            </span>
          </div>
          <div className="mt-2 w-full bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.storagePercentage}%` }}
            />
          </div>
        </div>

        {/* Card 3: Indexed Knowledge */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-elevation-1 border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-on-surface-variant">Kiến thức đã lập chỉ mục</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low text-tertiary flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-on-surface tracking-tight">
              {stats.indexedConcepts.toLocaleString()}
            </span>
            <span className="text-[13px] text-on-surface-variant">khái niệm</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] font-medium text-tertiary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sẵn sàng truy vấn nhanh</span>
          </div>
        </div>

        {/* Card 4: Linked Sessions */}
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-elevation-1 border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-on-surface-variant">Số buổi học liên kết</span>
            <div className="w-9 h-9 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-on-surface tracking-tight">
              {stats.linkedSessions}
            </span>
            <span className="text-[13px] text-on-surface-variant">phiên học AI</span>
          </div>
          <div className="mt-2 text-[12px] text-on-surface-variant">
            Hoạt động hôm nay
          </div>
        </div>
      </div>

      {/* Search and Filters Ribbon */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-elevation-1 border border-outline-variant/30">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tài liệu, chủ đề, tag môn học..."
            className="w-full pl-10 pr-4 py-2.5 text-[14px] rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid (3 columns on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-on-surface-variant text-[14px]">
            Đang tải danh sách tài liệu...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-16 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
            <FolderOpen className="w-12 h-12 text-outline-variant" />
            <h3 className="text-[16px] font-bold text-on-surface">Chưa tìm thấy tài liệu phù hợp</h3>
            <p className="text-[13px] text-on-surface-variant max-w-sm">
              Hãy thử tìm kiếm với từ khóa khác hoặc tải lên tệp tài liệu mới của bạn.
            </p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all group"
            >
              <div className="flex flex-col gap-3">
                {/* Header tags */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-primary-fixed text-on-primary-fixed">
                      {doc.fileType.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                      Đã lập chỉ mục
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa tài liệu "${doc.title}"?`)) {
                        deleteMutation.mutate(doc._id);
                      }
                    }}
                    title="Xóa tài liệu"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-outline-variant hover:text-error hover:bg-surface-container transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-headline-sm text-[16px] font-bold text-on-surface leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-[12px] text-on-surface-variant line-clamp-2 mt-1">
                    {doc.summary || doc.extractedText?.slice(0, 110) || 'Tài liệu học tập được lập chỉ mục bởi Lumina AI.'}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags?.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-on-surface-variant font-medium">Tiến độ nắm vững</span>
                  <span className="font-bold text-primary">{doc.masteryPercent || 0}%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${doc.masteryPercent || 0}%` }}
                  />
                </div>

                {/* Study Action CTA */}
                <button
                  onClick={() => handleStudyWithDoc(doc)}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-primary-fixed/60 hover:bg-primary hover:text-on-primary text-on-primary-fixed font-semibold text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Học cùng Lumina AI</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
