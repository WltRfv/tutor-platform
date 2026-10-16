import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Gamepad2, FileText, Users } from 'lucide-react';

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

export default async function StudentGamesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;

  // Игры из открытых тем
  const unlocks = await prisma.topicUnlock.findMany({
    where: { userId },
    select: { topicId: true, contentIds: true },
  });

  const contentFilter = new Map<string, Set<string> | null>();
  unlocks.forEach((u) => {
    const raw = u.contentIds as unknown as string[] | null | undefined;
    contentFilter.set(u.topicId, Array.isArray(raw) ? new Set(raw) : null);
  });

  const topicIds = unlocks.map((u) => u.topicId);

  const gamesByTopic = topicIds.length
    ? await prisma.game.findMany({
        where: {
          topicId: { in: topicIds },
          published: true,
          isTemplate: false,
        },
        include: {
          subject: { select: { name: true } },
          topic: { select: { title: true } },
        },
      })
    : [];

  const filtered = gamesByTopic.filter((g) => {
    if (!g.topicId) return true;
    const filter = contentFilter.get(g.topicId) ?? null;
    if (filter === null) return true;
    return filter.has(`game:${g.id}`);
  });

  // Обязательные игры
  const assigned = await prisma.assignedGame.findMany({
    where: { userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    include: {
      game: {
        include: {
          subject: { select: { name: true } },
          topic: { select: { title: true } },
        },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  const assignedIds = new Set(assigned.map((a) => a.gameId));
  const regular = filtered.filter((g) => !assignedIds.has(g.id));

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <Gamepad2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Игры</h1>
          <p className="text-slate-400 text-sm">
            Тренируйся и закрепляй материал
          </p>
        </div>
      </div>

      {/* Обязательные */}
      {assigned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-3">
            Назначено учителем
          </h2>
          <div className="space-y-2">
            {assigned.map((a) => (
              <Link
                key={a.id}
                href={`/student/games/${a.game.id}`}
                className="block backdrop-blur-xl bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 hover:bg-amber-500/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex-shrink-0">
                    <Gamepad2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {a.game.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {TYPE_LABELS[a.game.type] || a.game.type} ·{' '}
                      {a.game.subject.name}
                      {a.game.topic && ` · ${a.game.topic.title}`}
                    </div>
                  </div>
                  {a.dueDate && (
                    <div className="text-xs text-amber-400 flex-shrink-0">
                      до {new Date(a.dueDate).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Обычные */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Доступные игры
        </h2>
        {regular.length === 0 ? (
          <div className="text-center py-16 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Пока нет доступных игр</p>
            <p className="text-xs mt-2">
              Игры появляются, когда учитель открывает тему
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {regular.map((g) => (
              <Link
                key={g.id}
                href={`/student/games/${g.id}`}
                className="block group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-purple-500/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                    <Gamepad2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {g.title}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {TYPE_LABELS[g.type] || g.type} · {g.subject.name}
                      {g.topic && ` · ${g.topic.title}`}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}