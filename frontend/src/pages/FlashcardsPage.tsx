import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../lib/axiosClient.js';
import { queryKeys } from '../lib/queryKeys.js';
import {
  FlashcardDeck,
  Flashcard,
  ApiSuccess,
} from '../types/api.js';
import {
  RotateCw,
  Star,
  Sparkles,
  HelpCircle,
  Volume2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Brain,
  CheckCircle,
} from 'lucide-react';

export const FlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // 1. Fetch Flashcard Decks
  const { data: decksData } = useQuery({
    queryKey: queryKeys.flashcards.decks,
    queryFn: async () => {
      const res = (await axiosClient.get('/flashcards/decks')) as unknown as ApiSuccess<FlashcardDeck[]>;
      return res.data;
    },
  });

  const decks = decksData || [];
  const currentDeck = decks.find((d) => d._id === selectedDeckId) || decks[0] || null;

  useEffect(() => {
    if (!selectedDeckId && decks.length > 0 && decks[0]) {
      setSelectedDeckId(decks[0]._id);
    }
  }, [decks, selectedDeckId]);

  // 2. Fetch Cards for current deck
  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: currentDeck ? queryKeys.flashcards.deckCards(currentDeck._id) : ['empty-deck-cards'],
    queryFn: async () => {
      if (!currentDeck) return [];
      const res = (await axiosClient.get(`/flashcards/decks/${currentDeck._id}/cards`)) as unknown as ApiSuccess<Flashcard[]>;
      return res.data;
    },
    enabled: !!currentDeck,
  });

  const cards = cardsData || [];
  const currentCard = cards[currentIndex] || null;

  // 3. Fetch Deck Stats
  const { data: statsData } = useQuery({
    queryKey: currentDeck ? queryKeys.flashcards.deckStats(currentDeck._id) : ['empty-deck-stats'],
    queryFn: async () => {
      if (!currentDeck) return null;
      const res = (await axiosClient.get(`/flashcards/decks/${currentDeck._id}/stats`)) as unknown as ApiSuccess<{
        total: number;
        mastered: number;
        learning: number;
        newCards: number;
        masteryRate: number;
      }>;
      return res.data;
    },
    enabled: !!currentDeck,
  });

  // 4. Review Mutation (SRS)
  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, rating }: { cardId: string; rating: 'again' | 'hard' | 'good' | 'easy' }) => {
      const res = (await axiosClient.post(`/flashcards/cards/${cardId}/review`, { rating })) as unknown as ApiSuccess<Flashcard>;
      return res.data;
    },
    onSuccess: () => {
      if (currentDeck) {
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.deckCards(currentDeck._id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.deckStats(currentDeck._id) });
      }
      setIsFlipped(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
  });

  // Keyboard navigation: Space to flip, 1-4 for SRS rating, Arrow keys for prev/next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev - 1);
      } else if (currentCard) {
        if (e.key === '1') reviewMutation.mutate({ cardId: currentCard._id, rating: 'again' });
        if (e.key === '2') reviewMutation.mutate({ cardId: currentCard._id, rating: 'hard' });
        if (e.key === '3') reviewMutation.mutate({ cardId: currentCard._id, rating: 'good' });
        if (e.key === '4') reviewMutation.mutate({ cardId: currentCard._id, rating: 'easy' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards, currentCard, reviewMutation]);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-space-lg py-space-md flex flex-col gap-space-md">
      {/* Header Deck Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Trích xuất tự động • {cards.length} thẻ
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">
              Kinh tế Vi mô
            </span>
          </div>
          <h1 className="font-headline-lg text-[24px] font-bold text-on-surface">
            {currentDeck?.title || 'Bộ thẻ ôn tập'}
          </h1>
        </div>

        {/* Deck Selector and Actions */}
        <div className="flex items-center gap-2">
          {decks.length > 1 && (
            <select
              value={currentDeck?._id || ''}
              onChange={(e) => {
                setSelectedDeckId(e.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="text-[13px] font-semibold px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
            >
              {decks.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => speakText(currentCard ? `${currentCard.term}. ${currentCard.definition}` : '')}
            title="Đọc to (Text-to-speech)"
            className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsFlipped(false);
              setCurrentIndex(Math.floor(Math.random() * cards.length));
            }}
            title="Xáo trộn ngẫu nhiên"
            className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-[13px] font-bold text-primary">
            Thẻ {cards.length > 0 ? currentIndex + 1 : 0} / {cards.length}
          </span>
          <div className="w-48 bg-surface-container h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 text-[12px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
            Tỉ lệ ghi nhớ tốt: <strong className="text-secondary">{statsData?.masteryRate || 68}%</strong>
          </span>
          <span className="text-outline-variant">•</span>
          <span>Mục tiêu: 15 thẻ/ngày</span>
        </div>
      </div>

      {/* CENTRAL 3D FLIPPING CARD CONTAINER */}
      <div className="perspective-1000 w-full min-h-[430px] flex items-center justify-center my-2">
        {cardsLoading ? (
          <div className="py-20 text-on-surface-variant text-[14px]">Đang tải dữ liệu bộ thẻ...</div>
        ) : !currentCard ? (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <Brain className="w-10 h-10 text-outline-variant" />
            <p className="text-[14px] text-on-surface-variant">Bộ thẻ này hiện chưa có thẻ nào.</p>
          </div>
        ) : (
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full max-w-2xl min-h-[420px] rounded-3xl cursor-pointer transition-transform duration-700 transform-style-3d relative shadow-elevation-2 border border-outline-variant/30 ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* FRONT FACE */}
            <div className="absolute inset-0 w-full h-full bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between backface-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-surface-container-low text-primary flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Khái niệm cốt lõi • Độ khó: {currentCard.difficulty === 'easy' ? 'Dễ' : currentCard.difficulty === 'hard' ? 'Khó' : 'Trung bình'}
                  </span>
                  <span className="text-outline-variant text-[12px] font-mono">
                    ID: #{currentCard._id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // bookmark
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:text-amber-500 hover:bg-surface-container transition-colors"
                >
                  <Star className={`w-5 h-5 ${currentCard.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              </div>

              {/* Card Front Content */}
              <div className="flex flex-col items-center text-center my-auto px-4 py-2">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4 text-primary">
                  <Brain className="w-7 h-7" />
                </div>
                <span className="text-[12px] font-bold text-outline uppercase tracking-wider mb-2">
                  Thuật ngữ chuyên đề
                </span>
                <h2 className="font-headline-lg text-[24px] md:text-[28px] text-on-surface font-bold tracking-tight">
                  {currentCard.term}
                </h2>

                {currentCard.formula && (
                  <div className="mt-4 inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-surface-container-low text-on-surface border border-outline-variant/30">
                    <span className="text-[11px] font-bold text-outline uppercase">Công thức</span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-mono text-[14px] font-bold text-primary">
                      {currentCard.formula}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Hint */}
              <div className="flex items-center justify-center gap-2 pt-2 text-outline text-[12px]">
                <RotateCw className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '6s' }} />
                <span>Bấm chuột vào thẻ hoặc nhấn <kbd className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-mono text-[10px]">Space</kbd> để lật thẻ</span>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="absolute inset-0 w-full h-full bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between rotate-y-180 backface-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Định nghĩa & Diễn giải chi tiết
                </span>
                <span className="text-outline-variant text-[12px]">Nhấn Space để lật lại</span>
              </div>

              <div className="flex flex-col gap-4 text-left my-auto px-2">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold text-primary">Định nghĩa chuẩn xác:</span>
                  <p className="text-[15px] text-on-surface leading-relaxed">
                    {currentCard.definition}
                  </p>
                </div>

                {currentCard.formula && (
                  <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
                    <span className="text-[12px] text-on-surface-variant font-medium">Biểu thức tính toán:</span>
                    <span className="font-mono text-[13px] text-primary font-bold">{currentCard.formula}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[12px] text-outline">
                Chọn mức độ nhớ bên dưới để hệ thống SRS lên lịch ôn tập tối ưu
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4 SRS RATING BUTTONS */}
      {currentCard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto w-full">
          {/* Again */}
          <button
            onClick={() => reviewMutation.mutate({ cardId: currentCard._id, rating: 'again' })}
            disabled={reviewMutation.isPending}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest border border-error/30 hover:bg-error/10 transition-all cursor-pointer group"
          >
            <span className="text-[14px] font-bold text-error">Chưa nhớ</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Ôn lại: 1 ngày (phím 1)</span>
          </button>

          {/* Hard */}
          <button
            onClick={() => reviewMutation.mutate({ cardId: currentCard._id, rating: 'hard' })}
            disabled={reviewMutation.isPending}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest border border-amber-500/30 hover:bg-amber-500/10 transition-all cursor-pointer group"
          >
            <span className="text-[14px] font-bold text-amber-600">Khó nhớ</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Ôn lại: 2 ngày (phím 2)</span>
          </button>

          {/* Good */}
          <button
            onClick={() => reviewMutation.mutate({ cardId: currentCard._id, rating: 'good' })}
            disabled={reviewMutation.isPending}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest border border-primary/30 hover:bg-primary-fixed transition-all cursor-pointer group"
          >
            <span className="text-[14px] font-bold text-primary">Nhớ tốt</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Ôn lại: 3 ngày (phím 3)</span>
          </button>

          {/* Easy */}
          <button
            onClick={() => reviewMutation.mutate({ cardId: currentCard._id, rating: 'easy' })}
            disabled={reviewMutation.isPending}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-container-lowest border border-secondary/30 hover:bg-secondary-container/40 transition-all cursor-pointer group"
          >
            <span className="text-[14px] font-bold text-secondary">Rất dễ</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Ôn lại: 7 ngày (phím 4)</span>
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-[13px] font-semibold hover:bg-surface-container disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Thẻ trước</span>
        </button>

        <span className="text-[11px] text-outline hidden sm:inline">
          Dùng phím mũi tên ← → để chuyển thẻ
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex >= cards.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-[13px] font-semibold shadow-sm hover:bg-primary-container disabled:opacity-40 cursor-pointer"
        >
          <span>Tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Retention Overview Bento */}
      <div className="mt-4 p-space-md rounded-2xl bg-surface-container-lowest shadow-elevation-1 border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant uppercase font-bold">Đã thuộc lâu</span>
            <span className="text-[20px] font-bold text-secondary">{statsData?.mastered || 1} thẻ</span>
          </div>
          <div className="w-px h-8 bg-outline-variant/40" />
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant uppercase font-bold">Đang học ôn</span>
            <span className="text-[20px] font-bold text-primary">{statsData?.learning || 2} thẻ</span>
          </div>
          <div className="w-px h-8 bg-outline-variant/40" />
          <div className="flex flex-col">
            <span className="text-[11px] text-on-surface-variant uppercase font-bold">Chưa học</span>
            <span className="text-[20px] font-bold text-outline">{statsData?.newCards || 0} thẻ</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-bold text-[13px] hover:bg-secondary-container transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-secondary" />
            <span>Luyện trắc nghiệm nhanh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
