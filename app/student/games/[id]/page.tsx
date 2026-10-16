import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CardsGamePlayer } from '@/components/student/CardsGamePlayer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    select: { id: true, title: true, type: true, published: true, topicId: true },
  });
  if (!game || !game.published) notFound();

  // Проверка доступа
  let hasAccess = false;
  if (game.topicId) {
    const unlock = await prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: game.topicId, userId } },
      select: { contentIds: true },
    });
    if (unlock) {
      const raw = unlock.contentIds as unknown as string[] | null | undefined;
      if (!Array.isArray(raw) || raw.includes(`game:${id}`)) hasAccess = true;
    }
  }
  if (!hasAccess) {
    const assigned = await prisma.assignedGame.findUnique({
      where: { gameId_userId: { gameId: id, userId } },
    });
    if (assigned) hasAccess = true;
  }

  if (!hasAccess) notFound();

  if (game.type !== 'CARDS') {
    return (
      <div className="p-8 max-w-2xl">
        <Link
          href="/student/games"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> К играм
        </Link>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
          Этот тип игры пока не поддерживается
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/student/games"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К играм
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">{game.title}</h1>

      <CardsGamePlayer gameId={game.id} gameTitle={game.title} />
    </div>
  );
}