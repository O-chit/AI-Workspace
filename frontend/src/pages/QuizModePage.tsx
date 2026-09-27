import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../lib/axiosClient.js';
import { queryKeys } from '../lib/queryKeys.js';
import {
  QuizAttempt,
  QuizQuestion,
  ApiSuccess,
} from '../types/api.js';
import {
  Clock,
  Flag,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  Sparkles,
  Award,
} from 'lucide-react';

export const QuizModePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentOrder, setCurrentOrder] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins countdown
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  // 1. Fetch available attempts or latest
  const { data: attemptData, isLoading } = useQuery({
    queryKey: activeAttemptId ? queryKeys.quiz.attempt(activeAttemptId) : ['latest-quiz-attempt'],
    queryFn: async () => {
      // If we don't have an ID, fetch recent documents to find or start a quiz
      const docsRes = (await axiosClient.get('/documents')) as unknown as ApiSuccess<{ items: any[] }>;
      const doc = docsRes.data.items[0];

      if (!activeAttemptId && doc) {
        // Try generate or find
        const genRes = (await axiosClient.post('/quiz/generate', {
          documentId: doc._id,
          questionCount: 4,
          difficulty: 'medium',
        })) as unknown as ApiSuccess<{ attempt: QuizAttempt; questions: QuizQuestion[] }>;
        setActiveAttemptId(genRes.data.attempt._id);
        return genRes.data;
      }

      const res = (await axiosClient.get(`/quiz/attempts/${activeAttemptId}`)) as unknown as ApiSuccess<{
        attempt: QuizAttempt;
        questions: QuizQuestion[];
      }>;
      return res.data;
    },
  });

  const attempt = attemptData?.attempt || null;
  const questions = attemptData?.questions || [];
  const currentQuestion = questions.find((q) => q.order === currentOrder) || questions[0] || null;

  // Countdown timer
  useEffect(() => {
    if (attempt?.status === 'submitted') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt?.status]);

  // 2. Answer Question Mutation
  const answerMutation = useMutation({
    mutationFn: async ({
      questionId,
      selectedKey,
      flaggedForReview,
    }: {
      questionId: string;
      selectedKey?: 'A' | 'B' | 'C' | 'D';
      flaggedForReview?: boolean;
    }) => {
      if (!attempt) return null;
      const res = (await axiosClient.patch(`/quiz/attempts/${attempt._id}/answer`, {
        questionId,
        selectedKey,
        flaggedForReview,
      })) as unknown as ApiSuccess<any>;
      return res.data;
    },
    onSuccess: () => {
      if (attempt) {
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.attempt(attempt._id) });
      }
    },
  });

  // 3. Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!attempt) return null;
      const res = (await axiosClient.post(`/quiz/attempts/${attempt._id}/submit`, {
        durationSeconds: 300 - timerSeconds,
      })) as unknown as ApiSuccess<{ attempt: QuizAttempt; questions: QuizQuestion[]; scorePercent: number }>;
      return res.data;
    },
    onSuccess: (data) => {
      if (attempt) {
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.attempt(attempt._id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.documents.stats });
      }
      alert(`Đã nộp bài thành công! Điểm số: ${data?.scorePercent || 0}%`);
    },
  });

  // Keyboard shortcut A, B, C, D
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (attempt?.status === 'submitted') return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && currentQuestion) {
        answerMutation.mutate({
          questionId: currentQuestion._id,
          selectedKey: key as 'A' | 'B' | 'C' | 'D',
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentQuestion, attempt?.status, answerMutation]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = questions.filter((q) => q.selectedKey).length;
  const isSubmitted = attempt?.status === 'submitted';

  return (
    <div className="w-full max-w-[1560px] mx-auto px-4 md:px-space-lg py-space-md flex flex-col gap-space-lg">
      {/* Quiz Top Header */}
      <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Lumina • Đề thi tiêu chuẩn
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">
              Kinh tế Vi mô — Chương 3
            </span>
          </div>
          <h1 className="font-headline-sm text-[20px] font-bold text-on-surface">
            {attempt?.title || 'Đang tạo đề thi ôn tập...'}
          </h1>
        </div>

        {/* Timer, Progress and Submit CTA */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Circular/Pill Countdown Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-mono text-[14px] font-bold text-on-surface">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div className="text-[13px] text-on-surface-variant font-medium">
            Đã làm: <strong className="text-primary">{answeredCount}</strong>/{questions.length}
          </div>

          {!isSubmitted ? (
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn nộp bài sớm?')) {
                  submitMutation.mutate();
                }
              }}
              disabled={submitMutation.isPending}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-[13px] shadow-sm hover:bg-primary-container transition-all cursor-pointer"
            >
              Nộp bài sớm
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-secondary-container text-on-secondary-container font-bold text-[13px] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Đã nộp bài
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Question, Right Navigator & AI Prediction */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Main Question (col-span-12 lg:col-span-8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-md">
          {isLoading ? (
            <div className="p-16 text-center text-on-surface-variant text-[14px]">
              Đang chuẩn bị câu hỏi trắc nghiệm...
            </div>
          ) : !currentQuestion ? (
            <div className="p-16 text-center text-on-surface-variant text-[14px]">
              Không tìm thấy câu hỏi.
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-6">
              {/* Question Header Meta */}
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-primary px-3 py-1 rounded-full bg-primary-fixed">
                    Câu hỏi {currentQuestion.order} / {questions.length}
                  </span>
                  <span className="text-[13px] font-semibold text-on-surface-variant hidden sm:inline">
                    {currentQuestion.topic || 'Chuyên đề: Cốt lõi'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[13px] font-semibold text-secondary">
                  <Award className="w-4 h-4" />
                  <span>1.0 Điểm</span>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="flex flex-col gap-2">
                <h2 className="font-headline-md text-[18px] md:text-[20px] font-bold text-on-surface leading-relaxed">
                  {currentQuestion.prompt}
                </h2>
                {currentQuestion.formulaHint && (
                  <p className="text-[13px] text-on-surface-variant">
                    Gợi ý công thức: <strong className="text-primary font-mono">{currentQuestion.formulaHint}</strong>
                  </p>
                )}
              </div>

              {/* 4 Options Matrix */}
              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentQuestion.selectedKey === opt.key;
                  const isCorrectAnswer = isSubmitted && currentQuestion.correctKey === opt.key;
                  const isWrongSelected = isSubmitted && isSelected && currentQuestion.correctKey !== opt.key;

                  let borderBgClass = 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30';
                  if (isSelected && !isSubmitted) {
                    borderBgClass = 'bg-primary-fixed/40 border-primary shadow-xs';
                  } else if (isCorrectAnswer) {
                    borderBgClass = 'bg-secondary-container/50 border-secondary shadow-xs';
                  } else if (isWrongSelected) {
                    borderBgClass = 'bg-error/10 border-error shadow-xs';
                  }

                  return (
                    <div
                      key={opt.key}
                      onClick={() => {
                        if (!isSubmitted) {
                          answerMutation.mutate({
                            questionId: currentQuestion._id,
                            selectedKey: opt.key,
                          });
                        }
                      }}
                      className={`cursor-pointer p-4 rounded-2xl flex items-center justify-between border transition-all ${borderBgClass}`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0 transition-all ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-lowest text-on-surface'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="text-[14px] font-medium text-on-surface leading-snug">
                          {opt.text}
                        </span>
                      </div>

                      {isSelected && !isSubmitted && (
                        <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {isCorrectAnswer && (
                        <span className="text-[12px] font-bold text-secondary px-2.5 py-0.5 rounded-full bg-secondary-container">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation (shown after submission) */}
              {isSubmitted && currentQuestion.explanation && (
                <div className="p-4 rounded-2xl bg-secondary-container/30 border border-secondary/20 flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-secondary uppercase tracking-wider">
                    Lời giải chi tiết từ Lumina AI:
                  </span>
                  <p className="text-[13px] text-on-surface leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Action bar under question */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                <button
                  onClick={() => {
                    answerMutation.mutate({
                      questionId: currentQuestion._id,
                      flaggedForReview: !currentQuestion.flaggedForReview,
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors cursor-pointer ${
                    currentQuestion.flaggedForReview
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span>{currentQuestion.flaggedForReview ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại sau'}</span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-outline">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                  <span>Đã lưu tự động</span>
                </div>
              </div>

              {/* Bottom Question Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentOrder((prev) => Math.max(1, prev - 1))}
                  disabled={currentOrder === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low text-on-surface text-[13px] font-semibold hover:bg-surface-container disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <span className="text-[11px] text-outline hidden sm:inline">
                  Nhấn phím [A], [B], [C], [D] để chọn nhanh
                </span>

                <button
                  onClick={() => setCurrentOrder((prev) => Math.min(questions.length, prev + 1))}
                  disabled={currentOrder === questions.length}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-[13px] font-semibold shadow-xs hover:bg-primary-container disabled:opacity-40 cursor-pointer"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question Navigator & AI Prediction (col-span-12 lg:col-span-4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-md">
          {/* Question Navigator Grid */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-4">
            <h3 className="font-bold text-on-surface text-[14px]">Danh sách câu hỏi</h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q) => {
                const isCurrent = q.order === currentOrder;
                const isAnswered = !!q.selectedKey;
                const isFlagged = q.flaggedForReview;

                let btnClass = 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container';
                if (isCurrent) {
                  btnClass = 'ring-2 ring-primary font-bold bg-primary-fixed text-on-primary-fixed';
                } else if (isFlagged) {
                  btnClass = 'bg-amber-100 text-amber-700 font-bold';
                } else if (isAnswered) {
                  btnClass = 'bg-primary text-on-primary font-bold';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentOrder(q.order)}
                    className={`h-10 rounded-xl flex items-center justify-center text-[13px] transition-all cursor-pointer ${btnClass}`}
                  >
                    {q.order}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-fixed ring-2 ring-primary inline-block" />
                <span>Đang chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-200 inline-block" />
                <span>Đã gắn cờ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-surface-container-low inline-block" />
                <span>Chưa làm</span>
              </div>
            </div>
          </div>

          {/* AI Lumina Dự đoán Card (Real-time accuracy calculation) */}
          <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-elevation-1 border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-primary flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                AI Lumina Dự đoán
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-bold">
                Real-time
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-bold text-on-surface">
                {attempt?.aiPredictedAccuracy || 0}%
              </span>
              <span className="text-[12px] text-on-surface-variant font-medium">độ chính xác hiện tại</span>
            </div>

            <p className="text-[12px] text-on-surface-variant leading-relaxed">
              Hệ thống theo dõi tiến trình làm bài theo thời gian thực. Bạn đang thể hiện sự hiểu biết vững chắc về phần công thức co giãn PED.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-secondary font-semibold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Duy trì nhịp độ làm bài ổn định</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
