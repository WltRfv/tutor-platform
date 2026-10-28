
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GAME_TYPE_LABELS, type GameType } from '@/types/game';

type Game = {
  id: string;
  type: GameType;
  title: string;
  description: string | null;
  subjectName: string;
  topicName: string | null;
  published: boolean;
  itemsCount: number;
  sessionsCount: number;
  createdAt: string;
};

export default function TeacherGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher/games')
      .then(async (res) => {
        if (!res.ok) throw new Error('Не удалось загрузить игры');
        return res.json();
      })
      .then((data: Game[]) => setGames(data))
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Мои игры</h1>
          <p className="text-slate-400 mt-2">
            Создавай игры и управляй заданиями для учеников
          </p>
        </div>

        <Link href="/teacher/games/new">
          <Button className="bg-purple-600 hover:bg-purple-500 text-white">
            + Создать игру
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400">Загружаем игры...</p>
      ) : games.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            Пока нет игр
          </h2>
          <p className="text-slate-400 mt-2 mb-5">
            Создай первую игру, чтобы добавить задания.
          </p>
          <Link href="/teacher/games/new">
            <Button>Создать первую игру</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <article
              key={game.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {game.title}
                  </h2>
                  <p className="text-sm text-purple-300 mt-1">
                    {GAME_TYPE_LABELS[game.type] ?? game.type}
                  </p>
                </div>

                <span
                  className={`text-xs rounded-full px-3 py-1 ${
                    game.published
                      ? 'bg-green-500/10 text-green-300'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {game.published ? 'Опубликована' : 'Черновик'}
                </span>
              </div>

              {game.description && (
                <p className="text-sm text-slate-400 mt-3">
                  {game.description}
                </p>
              )}

              <div className="text-sm text-slate-400 mt-4 space-y-1">
                <p>Предмет: {game.subjectName}</p>
                {game.topicName && <p>Тема: {game.topicName}</p>}
                <p>Заданий: {game.itemsCount}</p>
                <p>Игровых сессий: {game.sessionsCount}</p>
              </div>

              <div className="mt-5">
                <Link href={`/teacher/games/${game.id}`}>
                  <Button variant="outline" className="w-full">
                    Редактировать
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
