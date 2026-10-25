'use client';
import { useRouter } from 'next/navigation';
import { RotateCcw, Trophy } from 'lucide-react';

export type GameResult = {
  percent: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalItems: number;
  durationSec: number;
};

type Props = {
  gameTitle: string;
  result: GameResult;
  correctLabel?: string;
  wrongLabel?: string;
};

export function GameResultScreen({
  gameTitle,
  result,
  correctLabel = 'Верно',
  wrongLabel = 'Неверно',
}: Props) {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
      <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
        <Trophy className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">Игра завершена</h2>
      <p className="text-slate-400 mb-8">{gameTitle}</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3">
          <div className="text-2xl font-bold text-emerald-400">{result.correctCount}</div>
          <div className="text-[11px] text-emerald-300 mt-1">{correctLabel}</div>
        </div>
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3">
          <div className="text-2xl font-bold text-red-400">{result.wrongCount}</div>
          <div className="text-[11px] text-red-300 mt-1">{wrongLabel}</div>
        </div>
        <div className="rounded-2xl bg-purple-500/10 border border-purple-500/30 p-3">
          <div className="text-2xl font-bold text-purple-400">{result.percent}%</div>
          <div className="text-[11px] text-purple-300 mt-1">Итог</div>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Время: {Math.floor(result.durationSec / 60)} мин {result.durationSec % 60} сек
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
          <RotateCcw className="h-4 w-4" /> Пройти заново
        </button>
      </div>
    </div>
  );
}