'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, ChevronRight } from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { cn } from '@/lib/utils';
import { parseQuizPayload, type QuizPayload } from '@/types/game';
import { GameResultScreen, type GameResult } from './GameResultScreen';

type Item = { id: string; payload: QuizPayload };
type Props = { gameId: string; gameTitle: string };

export function QuizGamePlayer({ gameId, gameTitle }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [itemStartedAt, setItemStartedAt] = useState<number>(Date.now());
  const [finished, setFinished] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/student/games/${gameId}/start`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не удалось начать');
        setItems(
          (data.items || []).map((it: any) => ({
            id: it.id,
            payload: parseQuizPayload(it.payload),
          }))
        );
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

  const choose = async (idx: number) => {
    if (!current || !sessionId || revealed) return;
    setSelected(idx);
    try {
      const res = await fetch(`/api/student/games/${gameId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          itemId: current.id,
          answer: { selectedIndex: idx },
          timeSpentMs: Date.now() - itemStartedAt,
        }),
      });
      const data = await res.json();
      setIsCorrect(
        typeof data.isCorrect === 'boolean'
          ? data.isCorrect
          : idx === current.payload.correct
      );
      setRevealed(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const next = async () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setSelected(null);
      setRevealed(false);
      setIsCorrect(null);
      setItemStartedAt(Date.now());
    } else {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/student/games/${gameId}/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не удалось завершить');
        setFinished(data.result);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  if (finished) return <GameResultScreen gameTitle={gameTitle} result={finished} />;

  if (!current)
    return <div className="text-center py-20 text-slate-500">Нет вопросов</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Вопрос {index + 1} из {total}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-4"
      >
        <MathText className="text-slate-200 text-lg leading-relaxed">
          {current.payload.text}
        </MathText>
      </motion.div>

      <div className="space-y-2">
        {current.payload.options.map((opt, oi) => {
          const isSelected = selected === oi;
          const isCorrectOpt = oi === current.payload.correct;
          const showCorrect = revealed && isCorrectOpt;
          const showWrong = revealed && isSelected && !isCorrectOpt;
          return (
            <button
              key={oi}
              type="button"
              onClick={() => choose(oi)}
              disabled={revealed}
              className={cn(
                'w-full text-left rounded-xl border p-4 transition',
                !revealed && 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/40',
                showCorrect && 'bg-emerald-500/15 border-emerald-500/50',
                showWrong && 'bg-red-500/15 border-red-500/50',
                revealed && !showCorrect && !showWrong && 'bg-white/[0.02] border-white/5 opacity-50'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0',
                    showCorrect ? 'bg-emerald-500 text-white' : showWrong ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400'
                  )}
                >
                  {oi + 1}
                </span>
                <MathText className="text-slate-200 text-sm flex-1">{opt}</MathText>
              </div>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className={cn('rounded-2xl p-4 mt-3 border text-center', isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30')}>
          <div className={cn('text-base font-semibold mb-1', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
            {isCorrect ? 'Верно!' : 'Неверно'}
          </div>
          {current.payload.explanation && (
            <div className="text-xs text-slate-500 mb-3">{current.payload.explanation}</div>
          )}
          <button
            onClick={next}
            disabled={submitting}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {index < total - 1 ? 'Дальше' : 'Завершить'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}