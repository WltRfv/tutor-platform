import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Gamepad2, Plus, Play, FileText, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  CARDS: 'Карточки',
  MATCHING: 'Сопоставление',
  FIND_ERROR: 'Найди ошибку',
  QUIZ: 'Викторина',
  TRAINER: 'Тренажёр',
  HINTS: 'Угадай по подсказкам',
  QUEST: 'Квест',
};

export default async function TeacherGamesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const teacherId = (session.user as any).id;
  const games = await prisma.game.findMany({
    where: { authorId: teacherId, isTemplate: false },
    orderBy: { createdAt: 'desc' },
    include: {
      subject: { select: { name: true } },
      topic: { select: { title: true } },
      _count: { select: { items: true, sessions: true } },
    },
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Игры</h1>
            <p className="text-slate-400 text-sm">
              Учебные мини-игры для закрепления материала
            </p>
          </div>
        </div>

        <Link
          href="/teacher/games/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
        >
          <Plus className="h-4 w-4" />
          Создать игру
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет игр</p>
          <Link
            href="/teacher/games/new"
            className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Создать первую игру →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => (
            <Link
              key={g.id}
              href={`/teacher/games/${g.id}`}
              className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/40 transition"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg flex-shrink-0">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 inline-block mb-1">
                    {TYPE_LABELS[g.type] || g.type}
                  </div>
                  <h3 className="text-white font-semibold truncate">{g.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">
                      {g.subject.name}
                    </span>
                    {g.topic && (
                      <span className="text-xs text-slate-500 truncate">
                        · {g.topic.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {g._count.items}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {g._count.sessions} прохождений
                </span>
                {g.published ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-slate-500">черновик</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}