'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Eye,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  question: string;
  answer: string;
};

type Result = {
  percent: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalItems: number;
  durationSec: number;
};

type Props = {
  gameId: string;
  gameTitle: string;
};

export function CardsGamePlayer({ gameId, gameTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [marks, setMarks] = useState<Record<string, boolean | null>>({});
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [finished, setFinished] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/student/games/${gameId}/start`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setItems(data.items);
        setSessionId(data.sessionId);
        setStartedAt(Date.now());
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const current = items[index];
  const total = items.length;
  const answeredCount = Object.keys(marks).length;

  const mark = async (knew: boolean) => {
    if (!current || !sessionId) return;
    const nextMarks = { ...marks, [current.id]: knew };
    setMarks(nextMarks);

    try {
      await fetch(`/api/student/games/${gameId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          itemId: current.id,
          selfMarked: knew,
          timeSpentMs: Date.now() - startedAt,
        }),
      });
    } catch {
      // тихо
    }

    // переход к следующей
    if (index < total - 1) {
      setIndex(index + 1);
      setShowAnswer(false);
      setStartedAt(Date.now());
    } else {
      await finish(nextMarks);
    }
  };

  const finish = async (allMarks: Record<string, boolean | null>) => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/games/${gameId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFinished(data.result);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
        <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Колода пройдена</h2>
        <p className="text-slate-400 mb-8">{gameTitle}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
            <div className="text-3xl font-bold text-emerald-400">
              {finished.correctCount}
            </div>
            <div className="text-xs text-emerald-300 mt-1">Знал</div>
          </div>
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
            <div className="text-3xl font-bold text-red-400">
              {finished.wrongCount}
            </div>
            <div className="text-xs text-red-300 mt-1">Не знал</div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          Время: {Math.floor(finished.durationSec / 60)} мин{' '}
          {finished.durationSec % 60} сек
        </p>

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => router.push('/student/games')}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition text-sm"
          >
            К списку игр
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Пройти заново
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-20 text-slate-500">
        В этой игре нет карточек
      </div>
    );
  }

  const markedThis = marks[current.id];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Карточка {index + 1} из {total}</span>
          <span>{answeredCount} отмечено</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Карточка */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + (showAnswer ? '-a' : '-q')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-3xl border p-8 min-h-[320px] flex flex-col justify-center',
            showAnswer
              ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
              : 'bg-white/5 border-white/10'
          )}
        >
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-4 text-center">
            {showAnswer ? 'Ответ' : 'Вопрос'}
          </div>
          <div className="text-center">
            <MathText className="text-slate-200 text-xl leading-relaxed">
              {showAnswer ? current.answer : current.question}
            </MathText>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Управление */}
      <div className="mt-6">
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition"
          >
            <Eye className="h-4 w-4" />
            Показать ответ
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => mark(false)}
              disabled={submitting}
              className="h-14 rounded-2xl bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 text-red-300 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <X className="h-5 w-5" />
              Не знал
            </button>
            <button
              onClick={() => mark(true)}
              disabled={submitting}
              className="h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
              Знал
            </button>
          </div>
        )}
      </div>

      {/* Навигация назад */}
      {index > 0 && !showAnswer && (
        <button
          onClick={() => {
            setIndex(index - 1);
            setShowAnswer(false);
          }}
          className="mt-4 w-full h-10 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition text-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Предыдущая
        </button>
      )}
    </div>
  );
}