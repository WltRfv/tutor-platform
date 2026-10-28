
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
  ArrowUpRight,
} from 'lucide-react';

import {
  GAME_TYPE_LABELS,
  type GameType,
} from '@/types/game';

const GAME_TYPES: {
  type: GameType;
  description: string;
  icon: typeof Layers;
  color: string;
}[] = [
  {
    type: 'CARDS',
    description: 'Вопросы и ответы для запоминания.',
    icon: Layers,
    color: 'from-purple-500/20 to-violet-500/5',
  },
  {
    type: 'MATCHING',
    description: 'Соединяй понятия и подходящие ответы.',
    icon: GitCompare,
    color: 'from-blue-500/20 to-indigo-500/5',
  },
  {
    type: 'FIND_ERROR',
    description: 'Находи ошибки и исправляй решения.',
    icon: Search,
    color: 'from-pink-500/20 to-purple-500/5',
  },
  {
    type: 'QUIZ',
    description: 'Вопросы с несколькими вариантами ответов.',
    icon: CircleHelp,
    color: 'from-indigo-500/20 to-blue-500/5',
  },
  {
    type: 'TRAINER',
    description: 'Практикуйся на последовательности заданий.',
    icon: Dumbbell,
    color: 'from-violet-500/20 to-purple-500/5',
  },
  {
    type: 'HINTS',
    description: 'Угадывай ответ по подсказкам.',
    icon: Lightbulb,
    color: 'from-amber-500/20 to-orange-500/5',
  },
  {
    type: 'QUEST',
    description: 'Проходи задания одно за другим.',
    icon: Map,
    color: 'from-cyan-500/20 to-blue-500/5',
  },
];

export default function NewGamePage() {
  const router = useRouter();

  function chooseGame(type: GameType) {
    router.push(`/teacher/games/new?type=${type}`);
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-5 py-10 text-white md:px-8">
      {/* Декоративное свечение, не перекрывающее карточки */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[min(800px,100%)] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl"
      />

      <div className="mx-auto max-w-6xl">
        <Link
          href="/teacher/games"
          className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm text-slate-300 transition hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к играм
        </Link>

        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-400">
            Конструктор игр
          </p>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Какую игру создадим?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Выбери формат, который подойдёт твоему уроку.
            Затем можно будет перейти к настройке игры.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_TYPES.map(({ type, description, icon: Icon, color }) => (
            <button
              key={type}
              type="button"
              onClick={() => chooseGame(type)}
              className="group relative z-10 min-h-52 cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left shadow-lg shadow-black/5 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-purple-400/50 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 active:translate-y-0"
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${color} opacity-70 transition group-hover:opacity-100`}
              />

              <div className="relative flex h-full min-h-40 flex-col">
                <div className="mb-5 flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-300 transition group-hover:border-purple-400/40 group-hover:bg-purple-500/20">
                    <Icon className="h-6 w-6" />
                  </span>

                  <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-purple-300" />
                </div>

                <h2 className="text-lg font-semibold text-white">
                  {GAME_TYPE_LABELS[type]}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {description}
                </p>

                <span className="mt-auto pt-5 text-sm font-semibold text-purple-300">
                  Выбрать формат →
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Некоторые форматы могут потребовать отдельного редактора.
          После выбора проверим, поддерживается ли создание выбранного типа.
        </p>
      </div>
    </main>
  );
}
