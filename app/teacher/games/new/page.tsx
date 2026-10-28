
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  GitCompare,
  Search,
  CircleHelp,
  Dumbbell,
  Lightbulb,
  Map,
} from 'lucide-react';
import { GAME_TYPE_LABELS, type GameType } from '@/types/game';
import { GameEditor } from '@/components/teacher/GameEditor';

const GAME_TYPES = [
  {
    type: 'CARDS',
    description: 'Создай карточки с вопросами и ответами.',
    icon: Layers,
  },
  {
    type: 'MATCHING',
    description: 'Предложи ученику найти подходящие пары.',
    icon: GitCompare,
  },
  {
    type: 'FIND_ERROR',
    description: 'Подготовь задания на поиск и исправление ошибок.',
    icon: Search,
  },
  {
    type: 'QUIZ',
    description: 'Создай вопросы с вариантами ответов.',
    icon: CircleHelp,
  },
  {
    type: 'TRAINER',
    description: 'Подготовь тренировочные задания.',
    icon: Dumbbell,
  },
  {
    type: 'HINTS',
    description: 'Предложи угадать ответ по подсказкам.',
    icon: Lightbulb,
  },
  {
    type: 'QUEST',
    description: 'Создай последовательность заданий в формате квеста.',
    icon: Map,
  },
] satisfies {
  type: GameType;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[];

function NewGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType = searchParams.get('type');

  const validType = GAME_TYPES.some(
    (item) => item.type === selectedType
  );

  if (validType && selectedType) {
    return (
      <GameEditor
        key={selectedType}
        defaultType={selectedType as GameType}
      />
    );
  }

  function chooseGame(type: GameType) {
    router.push(`/teacher/games/new?type=${type}`);
  }

  return (
    <main className="relative z-10 mx-auto max-w-5xl p-6 md:p-8">
      <Link
        href="/teacher/games"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к играм
      </Link>

      <h1 className="text-3xl font-bold text-white">
        Создать новую игру
      </h1>
      <p className="mt-2 text-slate-400">
        Выбери формат игры, которую хочешь создать.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_TYPES.map(({ type, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => chooseGame(type)}
            className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-purple-400/50 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-purple-950/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 transition group-hover:bg-purple-500/25">
              <Icon className="h-6 w-6" />
            </div>

            <h2 className="text-lg font-semibold text-white">
              {GAME_TYPE_LABELS[type]}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {description}
            </p>

            <div className="mt-5 font-medium text-purple-300">
              Выбрать →
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

export default function NewGamePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-slate-400">Загрузка...</div>
      }
    >
      <NewGameContent />
    </Suspense>
  );
}
