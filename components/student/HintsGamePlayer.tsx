'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  RotateCcw,
  Trophy,
  Lightbulb,
  Eye,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { cn } from '@/lib/utils';
import { parseHintsPayload, type HintsPayload } from '@/types/game';

type Item = { id: string; order: number; payload: HintsPayload };
type Phase = 'guess' | 'selfmark' | 'result';

type Result = {
  percent: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalItems: number;
  durationSec: number;
};

type Props = { gameId: string; gameTitle: string };

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"'«»]/g, '');
}

export function HintsGamePlayer({ gameId, gameTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('guess');
  const [revealedHints, setRevealedHints] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [itemStartedAt, setItemStartedAt] = useState<number>(Date.now());
  const [finished, setFinished] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/student/games/${gameId}/start`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не удалось начать игру');

        const parsed: Item[] = (data.items || []).map((it: any) => ({
          id: it.id,
          order: it.order ?? 0,
          payload: parseHintsPayload(it.payload),
        }));

        setItems(parsed);
        setSessionId(data.sessionId);
        setItemStartedAt(Date.now());
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

  const postAnswer = async (body: Record<string, unknown>) => {
    if (!sessionId || !current) return;
    try {
      await fetch(`/api/student/games/${gameId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          itemId: current.id,
          timeSpentMs: Date.now() - itemStartedAt,
          ...body,
        }),
      });
    } catch {
      // тихо
    }
  };

  const check = async () => {
    if (!current || !userAnswer.trim()) return;
    const correct =
      normalize(userAnswer) === normalize(current.payload.answer);
    setIsCorrect(correct);
    setShowAnswer(true);
    setPhase('result');
    await postAnswer({ isCorrect: correct });
  };

  const skip = () => {
    setShowAnswer(true);
    setPhase('selfmark');
  };

  const selfMark = async (knew: boolean) => {
    setIsCorrect(knew);
    setPhase('result');
    await postAnswer({ selfMarked: knew });
  };

  const nextItem = async () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setPhase('guess');
      setRevealedHints(0);
      setUserAnswer('');
      setShowAnswer(false);
      setIsCorrect(null);
      setItemStartedAt(Date.now());
    } else {
      await finish();
    }
  };

  const finish = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/games/${gameId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось завершить игру');
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
        <h2 className="text-3xl font-bold text-white mb-2">Игра завершена</h2>
        <p className="text-slate-400 mb-8">{gameTitle}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3">
            <div className="text-2xl font-bold text-emerald-400">
              {finished.correctCount}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">Верно</div>
          </div>
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3">
            <div className="text-2xl font-bold text-red-400">
              {finished.wrongCount}
            </div>
            <div className="text-[11px] text-red-300 mt-1">Неверно</div>
          </div>
          <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-3">
            <div className="text-2xl font-bold text-purple-400">
              {finished.percent}%
            </div>
            <div className="text-[11px] text-purple-300 mt-1">Итог</div>
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
        В этой игре нет вопросов
      </div>
    );
  }

  const hints = current.payload.hints;
  const canRevealMore = revealedHints < hints.length - 1;
  const currentHint = hints[revealedHints];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>
            Вопрос {index + 1} из {total}
          </span>
          <span>
            {revealedHints + 1} из {hints.length} подсказок
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Подсказки */}
      <div className="space-y-2 mb-4">
        <AnimatePresence initial={false}>
          {hints.slice(0, revealedHints + 1).map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl border p-4 flex items-start gap-3',
                i === revealedHints
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/5 border-white/10 opacity-70'
              )}
            >
              <Lightbulb
                className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  i === revealedHints ? 'text-amber-400' : 'text-slate-500'
                )}
              />
              <MathText className="text-slate-200 text-sm leading-relaxed">
                {h}
              </MathText>
            </motion.div>
          ))}
        </AnimatePresence>

        {phase === 'guess' && canRevealMore && (
          <button
            type="button"
            onClick={() => setRevealedHints(revealedHints + 1)}
            className="w-full h-9 rounded-xl border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition text-xs flex items-center justify-center gap-2"
          >
            <Lightbulb className="h-3 w-3" />
            Ещё подсказка
          </button>
        )}
      </div>

      {/* Ответ ученика / результат */}
      {phase === 'guess' && (
        <div className="space-y-3">
          <input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userAnswer.trim()) check();
            }}
            placeholder="Твой ответ..."
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white px-4 text-base focus:outline-none focus:border-purple-500/50"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={check}
              disabled={!userAnswer.trim()}
              className="h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold disabled:opacity-40 transition"
            >
              Проверить
            </button>
            <button
              onClick={skip}
              className="h-12 px-4 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition text-sm flex items-center gap-1.5"
            >
              <Eye className="h-4 w-4" />
              Сдаться
            </button>
          </div>
        </div>
      )}

      {phase === 'selfmark' && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            Правильный ответ
          </div>
          <MathText className="text-slate-200 text-lg mb-5">
            {current.payload.answer}
          </MathText>
          <p className="text-xs text-slate-500 mb-3">Ты знал ответ?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => selfMark(false)}
              className="h-14 rounded-2xl bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 text-red-300 font-semibold flex items-center justify-center gap-2 transition"
            >
              <X className="h-5 w-5" /> Не знал
            </button>
            <button
              onClick={() => selfMark(true)}
              className="h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Check className="h-5 w-5" /> Знал
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div
          className={cn(
            'rounded-2xl p-5 text-center border',
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}
        >
          <div
            className={cn(
              'text-2xl font-bold mb-1',
              isCorrect ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {isCorrect ? 'Верно!' : 'Не угадал'}
          </div>
          <div className="text-xs text-slate-500 mb-1">Правильный ответ:</div>
          <MathText className="text-slate-200 text-base mb-4">
            {current.payload.answer}
          </MathText>
          <button
            onClick={nextItem}
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {index < total - 1 ? 'Дальше' : 'Завершить'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}