import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GamePlayer } from '@/components/student/GamePlayer';
import { checkGameAccess } from '@/lib/game-access';
import type { GameType } from '@/types/game';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const access = await checkGameAccess(id, userId);
  if (!access.ok) notFound();

  const game = await prisma.game.findUnique({
    where: { id },
    select: { id: true, title: true, type: true },
  });
  if (!game) notFound();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/student/games"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К играм
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">{game.title}</h1>
      <GamePlayer
        gameId={game.id}
        gameType={game.type as GameType}
        gameTitle={game.title}
      />
    </div>
  );
}