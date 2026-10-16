import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!game || !game.published) {
    return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 });
  }

  // Проверка доступа: игра должна быть открыта либо через тему, либо через назначение
  let hasAccess = false;

  if (game.topicId) {
    const unlock = await prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: game.topicId, userId } },
      select: { contentIds: true },
    });
    if (unlock) {
      const raw = unlock.contentIds as unknown as string[] | null | undefined;
      if (!Array.isArray(raw) || raw.includes(`game:${id}`)) {
        hasAccess = true;
      }
    }
  }

  if (!hasAccess) {
    const assigned = await prisma.assignedGame.findUnique({
      where: { gameId_userId: { gameId: id, userId } },
    });
    if (assigned) hasAccess = true;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: 'Нет доступа к игре' }, { status: 403 });
  }

  // Не отдаём payload с правильными ответами — только сами карточки для показа
  // Для CARDS: вопрос и ответ отдаём, самооценка
  const items = game.items.map((it) => {
    const payload = (it.payload as any) || {};
    return {
      id: it.id,
      order: it.order,
      question: payload.question || '',
      answer: payload.answer || '',
      imageUrl: payload.imageUrl || null,
    };
  });

  const sessionRow = await prisma.gameSession.create({
    data: {
      gameId: id,
      userId,
      status: 'IN_PROGRESS',
    },
  });

  // Если игра назначена — отметим, что начал прохождение
  await prisma.assignedGame.updateMany({
    where: { gameId: id, userId, status: 'PENDING' },
    data: { status: 'IN_PROGRESS' },
  });

  return NextResponse.json({
    ok: true,
    sessionId: sessionRow.id,
    game: {
      id: game.id,
      type: game.type,
      title: game.title,
    },
    items,
  });
}