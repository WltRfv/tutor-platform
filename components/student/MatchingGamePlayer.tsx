'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RotateCcw, Trophy, Flag } from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { cn } from '@/lib/utils';
import { parseMatchingPayload, type MatchingPayload } from '@/types/game';

type PairItem = {
  id: string;
  payload: MatchingPayload;
};

type RightCard = {
  key: string;      // уникальный ключ (r_<id>)
  sourceId: string; // id исходной пары — для проверки совпадения
  text: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchingGamePlayer({ gameId, gameTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PairItem[]>([]);
  const [rightCards, setRightCards] = useState<RightCard[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightKey, setSelectedRightKey] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left: string; right: string } | null>(null);
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

        const parsed: PairItem[] = (data.items || []).map((it: any) => ({
          id: it.id,
          payload: parseMatchingPayload(it.payload),
        }));
        setItems(parsed);
        setRightCards(
          shuffle(
            parsed.map((p) => ({
              key: `r_${p.id}`,
              sourceId: p.id,
              text: p.payload.right,
            }))
          )
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

  const total = items.length;
  const matchedCount = matchedIds.size;

  const tryMatch = async (leftId: string, right: RightCard) => {
    if (!sessionId) return;
    const isCorrect = right.sourceId === leftId;

    if (isCorrect) {
      // серверная запись
      try {
        await fetch(`/api/student/games/${gameId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            itemId: leftId,
            isCorrect: true,
            timeSpentMs: Date.now() - itemStartedAt,
          }),
        });
      } catch {
        // тихо
      }

      const next = new Set(matchedIds);
      next.add(leftId);
      setMatchedIds(next);
      setSelectedLeftId(null);
      setSelectedRightKey(null);
      setItemStartedAt(Date.now());

      if (next.size === total) {
        // все пары найдены — можно завершать
        await finish();
      }
    } else {
      // вспышка ошибки — не пишем в БД
      setWrongFlash({ left: leftId, right: right.key });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeftId(null);
        setSelectedRightKey(null);
      }, 600);
    }
  };

  const handleClickLeft = (leftId: string) => {
    if (matchedIds.has(leftId)) return;
    setSelectedLeftId(leftId);
    if (selectedRightKey) {
      const right = rightCards.find((r) => r.key === selectedRightKey);
      if (right) tryMatch(leftId, right);
    }
  };

  const handleClickRight = (right: RightCard) => {
    if (matchedIds.has(right.sourceId)) return;
    setSelectedRightKey(right.key);
    if (selectedLeftId) {
      tryMatch(selectedLeftId, right);
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
            <div className="text-[11px] text-emerald-300 mt-1">Найдено</div>
          </div>
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3">
            <div className="text-2xl font-bold text-amber-400">
              {finished.skippedCount}
            </div>
            <div className="text-[11px] text-amber-300 mt-1">Пропущено</div>
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

  if (total === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        В этой игре нет пар
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>
            Найдено пар: {matchedCount} из {total}
          </span>
          <button
            type="button"
            onClick={finish}
            disabled={submitting}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            <Flag className="h-3 w-3" />
            Завершить
          </button>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${total > 0 ? (matchedCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Левая колонка */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 text-center">
            Понятия
          </div>
          <AnimatePresence>
            {items.map((it) => {
              const matched = matchedIds.has(it.id);
              const selected = selectedLeftId === it.id;
              const wrong = wrongFlash?.left === it.id;
              return (
                <motion.button
                  key={it.id}
                  type="button"
                  layout
                  onClick={() => handleClickLeft(it.id)}
                  disabled={matched || submitting}
                  className={cn(
                    'w-full min-h-[64px] rounded-xl border p-3 text-left transition',
                    matched && 'opacity-30 bg-emerald-500/5 border-emerald-500/20 cursor-default',
                    !matched && selected && 'bg-purple-500/20 border-purple-500/60',
                    !matched && wrong && 'bg-red-500/20 border-red-500/60 animate-shake',
                    !matched && !selected && !wrong && 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/40'
                  )}
                >
                  <MathText className="text-slate-200 text-sm leading-snug">
                    {it.payload.left}
                  </MathText>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Правая колонка */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 text-center">
            Определения
          </div>
          <AnimatePresence>
            {rightCards.map((rc) => {
              const matched = matchedIds.has(rc.sourceId);
              const selected = selectedRightKey === rc.key;
              const wrong = wrongFlash?.right === rc.key;
              return (
                <motion.button
                  key={rc.key}
                  type="button"
                  layout
                  onClick={() => handleClickRight(rc)}
                  disabled={matched || submitting}
                  className={cn(
                    'w-full min-h-[64px] rounded-xl border p-3 text-left transition',
                    matched && 'opacity-30 bg-emerald-500/5 border-emerald-500/20 cursor-default',
                    !matched && selected && 'bg-purple-500/20 border-purple-500/60',
                    !matched && wrong && 'bg-red-500/20 border-red-500/60',
                    !matched && !selected && !wrong && 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/40'
                  )}
                >
                  <MathText className="text-slate-200 text-sm leading-snug">
                    {rc.text}
                  </MathText>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        Выбери понятие слева и определение справа — совпадёт, если пара верная
      </p>
    </div>
  );
}