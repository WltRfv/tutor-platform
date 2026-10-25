import Link from 'next/link';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { GameEditor } from '@/components/teacher/GameEditor';
import { GAME_TYPE_LABELS, type GameType } from '@/types/game';

export const dynamic = 'force-dynamic';

const AVAILABLE: GameType[] = ['CARDS', 'MATCHING', 'HINTS', 'FIND_ERROR', 'QUIZ', 'TRAINER'];
const COMING_SOON: GameType[] = ['QUEST'];

const TYPE_DESCRIPTIONS: Record<GameType, string> = {
  CARDS: 'Вопрос — ответ, самооценка «знал / не знал»',
  MATCHING: 'Сопоставление понятий и определений в двух колонках',
  FIND_ERROR: 'Найти ошибку в утверждении и исправить её',
  QUIZ: 'Викторина с выбором ответа и подсчётом баллов',
  TRAINER: 'Тренажёр с мгновенной проверкой ответа',
  HINTS: 'Угадать ответ по подсказкам — от размытой к точной',
  QUEST: 'Квест из нескольких игр-уровней подряд',
};

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  if (type && AVAILABLE.includes(type as GameType)) {
    return <GameEditor defaultType={type as GameType} />;
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/teacher/games" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> К играм
      </Link>
      <h1 className="text-3xl font-bold text-white mb-1">Выбери тип игры</h1>
      <p className="text-slate-400 mb-8">От выбора зависит, как игра будет выглядеть для ученика</p>
      <div className="grid md:grid-cols-2 gap-3">
        {AVAILABLE.map((t) => (
          <Link
            key={t}
            href={`/teacher/games/new?type=${t}`}
            className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/40 transition"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex-shrink-0">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{GAME_TYPE_LABELS[t]}</h3>
                <p className="text-sm text-slate-400 mt-1">{TYPE_DESCRIPTIONS[t]}</p>
              </div>
            </div>
          </Link>
        ))}
        {COMING_SOON.map((t) => (
          <div key={t} className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl p-5 opacity-50">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 flex-shrink-0">
                <Gamepad2 className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-slate-300 font-semibold">{GAME_TYPE_LABELS[t]}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">скоро</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{TYPE_DESCRIPTIONS[t]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}