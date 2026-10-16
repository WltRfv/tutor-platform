import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GameEditor, type CardItem } from '@/components/teacher/GameEditor';

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

  const items: CardItem[] =
    game.type === 'CARDS'
      ? game.items.map((it) => {
          const p = (it.payload as any) || {};
          return {
            id: it.id,
            question: p.question || '',
            answer: p.answer || '',
          };
        })
      : [];

  return (
    <GameEditor
      gameId={game.id}
      initial={{
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