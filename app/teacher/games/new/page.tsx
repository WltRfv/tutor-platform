
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

import {
  GAME_TYPE_LABELS,
  type GameType,
} from '@/types/game';

const GAME_TYPES: {
  type: GameType;
  description: string;
  icon: typeof Layers;
}[] = [
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
];

export default function NewGamePage() {
  const router = useRouter();

  function chooseGame(type: GameType) {
    router.push(`/teacher/games/new?type=${type}`);
  }

  return (
    <main className="mx-auto max-w-5xl p-6 md:p-8">
      <Link
        href="/teacher/games"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к играм
      </Link>

      <h1 className="text-3xl font-bold">
        Создать новую игру
      </h1>

      <p className="mt-2 text-muted-foreground">
        Выбери формат игры, которую хочешь создать.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_TYPES.map(({ type, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => chooseGame(type)}
            className="group rounded-xl border bg-card p-5 text-left transition hover:border-primary hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>

            <h2 className="text-lg font-semibold">
              {GAME_TYPE_LABELS[type]}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>

            <div className="mt-5 font-medium text-primary">
              Выбрать →
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
