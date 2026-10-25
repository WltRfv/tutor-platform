'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { cn } from '@/lib/utils';
import { parseFindErrorPayload, type FindErrorPayload } from '@/types/game';
import { GameResultScreen, type GameResult } from './GameResultScreen';

type Item = { id: string; payload: FindErrorPayload };
type Props = { gameId: string; gameTitle: string };

export function FindErrorGamePlayer({ gameId, gameTitle }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<'error' | 'ok' | null>(null);
  const [correction, setCorrection] = useState('');
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
        if (!res.ok) throw new Error(data.error || 'Не удалось начать игру');
        setItems(
          (data.items || []).map((it: any) => ({
            id: it.id,
            payload: parseFindErrorPayload(it.payload),
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

  const submit = async () => {
    if (!current || !sessionId || !verdict) return;
    try {
      const res = await fetch(`/api/student/games/${gameId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          itemId: current.id,
          answer: { verdict, correction },
          timeSpentMs: Date.now() - itemStartedAt,
        }),
      });
      const data = await res.json();
      setIsCorrect(
        typeof data.isCorrect === 'boolean'
          ? data.isCorrect
          : verdict === (current.payload.hasError ? 'error' : 'ok')
      );
      setRevealed(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const next = async () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setVerdict(null);
      setCorrection('');
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

  if (finished)
    return <GameResultScreen gameTitle={gameTitle} result={finished} correctLabel="Нашёл" wrongLabel="Промах" />;

  if (!current)
    return <div className="text-center py-20 text-slate-500">Нет утверждений</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Утверждение {index + 1} из {total}</span>
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
        className="rounded-3xl border bg-white/5 border-white/10 p-8 mb-4"
      >
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-4 text-center">
          Есть ли ошибка?
        </div>
        <MathText className="text-slate-200 text-lg text-center block leading-relaxed">
          {current.payload.statement}
        </MathText>
      </motion.div>

      {!revealed && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setVerdict('error')}
            className={cn(
              'h-14 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition',
              verdict === 'error'
                ? 'bg-red-500/20 border-red-500/60 text-red-200'
                : 'bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-500/20'
            )}
          >
            <AlertCircle className="h-5 w-5" /> Есть ошибка
          </button>
          <button
            onClick={() => setVerdict('ok')}
            className={cn(
              'h-14 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition',
              verdict === 'ok'
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
            )}
          >
            <CheckCircle2 className="h-5 w-5" /> Всё верно
          </button>
        </div>
      )}

      {verdict === 'error' && !revealed && (
        <div className="mt-3">
          <input
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Как должно быть? (необязательно)"
            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white px-4 text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>
      )}

      {!revealed && (
        <button
          onClick={submit}
          disabled={!verdict}
          className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold disabled:opacity-40 transition"
        >
          Ответить
        </button>
      )}

      {revealed && (
        <div
          className={cn(
            'rounded-2xl p-5 text-center border mt-3',
            isCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}
        >
          <div className={cn('text-xl font-bold mb-2', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
            {isCorrect ? 'Верно!' : 'Неверно'}
          </div>
          {current.payload.hasError && current.payload.correction && (
            <div className="text-xs text-slate-400 mb-1">
              Правильно:
              <MathText className="text-slate-200 text-sm block mt-1">
                {current.payload.correction}
              </MathText>
            </div>
          )}
          {!current.payload.hasError && (
            <div className="text-xs text-slate-400">В утверждении ошибки не было</div>
          )}
          {current.payload.explanation && (
            <div className="text-xs text-slate-500 mt-3">
              {current.payload.explanation}
            </div>
          )}
          <button
            onClick={next}
            disabled={submitting}
            className="mt-4 w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {index < total - 1 ? 'Дальше' : 'Завершить'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
