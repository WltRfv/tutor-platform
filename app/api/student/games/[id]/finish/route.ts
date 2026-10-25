import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const userId = (session.user as any).id as string;
  const { id } = await params;

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) return NextResponse.json({ error: 'Нужен sessionId' }, { status: 400 });

  const sessionRow = await prisma.gameSession.findFirst({
    where: { id: sessionId, userId, gameId: id },
    include: { answers: true },
  });
  if (!sessionRow) return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  if (sessionRow.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Сессия уже завершена' }, { status: 400 });
  }

  const totalItems = await prisma.gameItem.count({ where: { gameId: id } });

  let correctCount = 0;
  let wrongCount = 0;
  const answeredItemIds = new Set<string>();

  for (const a of sessionRow.answers) {
    if (a.itemId) answeredItemIds.add(a.itemId);
    const ok = a.isCorrect === true || a.selfMarked === true;
    const bad = a.isCorrect === false || a.selfMarked === false;
    if (ok) correctCount++;
    else if (bad) wrongCount++;
  }

  const skippedCount = Math.max(0, totalItems - answeredItemIds.size);
  const percent = totalItems > 0
    ? Math.round((correctCount / totalItems) * 100)
    : 0;

  const durationSec = Math.max(
    0,
    Math.round((Date.now() - sessionRow.startedAt.getTime()) / 1000)
  );

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      status: 'FINISHED',
      finishedAt: new Date(),
      score: correctCount,
      totalPoints: totalItems,
      percent,
      correctCount,
      wrongCount,
      skippedCount,
      durationSec,
    },
  });

  await prisma.assignedGame.updateMany({
    where: { gameId: id, userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    result: { percent, correctCount, wrongCount, skippedCount, totalItems, durationSec },
  });
}