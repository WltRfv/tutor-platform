import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GameEditor } from '@/components/teacher/GameEditor';
import type { GameType } from '@/types/game';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const game = await prisma.game.findFirst({
    where: { id, authorId: (session.user as any).id },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!game) notFound();

  const items = game.items.map((it) => ({
    id: it.id,
    payload: it.payload,
  }));

  return (
    <GameEditor
      gameId={game.id}
      initial={{
        type: game.type as GameType,
        title: game.title,
        description: game.description || '',
        subjectId: game.subjectId,
        topicId: game.topicId || '',
        published: game.published,
        items,
      }}
    />
  );
}