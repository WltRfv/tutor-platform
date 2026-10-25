import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkGameAccess } from '@/lib/game-access';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const access = await checkGameAccess(id, userId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.reason === 'not_found' ? 'Игра не найдена' : 'Нет доступа к игре' },
      { status: access.reason === 'not_found' ? 404 : 403 }
    );
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!game) return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });

  const items = game.items.map((it) => ({
    id: it.id,
    order: it.order,
    payload: it.payload,
    questionId: it.questionId,
  }));

  const sessionRow = await prisma.gameSession.create({
    data: { gameId: id, userId, status: 'IN_PROGRESS' },
  });

  await prisma.assignedGame.updateMany({
    where: { gameId: id, userId, status: 'PENDING' },
    data: { status: 'IN_PROGRESS' },
  });

  return NextResponse.json({
    ok: true,
    sessionId: sessionRow.id,
    game: { id: game.id, type: game.type, title: game.title, settings: game.settings },
    items,
  });
}