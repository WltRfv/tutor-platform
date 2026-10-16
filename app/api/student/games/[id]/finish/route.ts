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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { sessionId } = body;
  if (!sessionId) return NextResponse.json({ error: 'Нужен sessionId' }, { status: 400 });

  const sessionRow = await prisma.gameSession.findFirst({
    where: { id: sessionId, userId, gameId: id },
    include: { answers: true },
  });
  if (!sessionRow) {
    return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  }
  if (sessionRow.status === 'COMPLETED') {
    return NextResponse.json({ ok: true, alreadyFinished: true });
  }

  const totalItems = await prisma.gameItem.count({ where: { gameId: id } });

  let correctCount = 0;
  let wrongCount = 0;
  for (const a of sessionRow.answers) {
    if (a.selfMarked === true) correctCount++;
    else if (a.selfMarked === false) wrongCount++;
  }

  const answered = sessionRow.answers.length;
  const skippedCount = Math.max(0, totalItems - answered);
  const percent = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;

  const startedAt = sessionRow.startedAt;
  const finishedAt = new Date();
  const durationSec = Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000));

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      score: correctCount,
      totalPoints: totalItems,
      percent,
      correctCount,
      wrongCount,
      skippedCount,
      durationSec,
      finishedAt,
    },
  });

  // Отмечаем назначение выполненным
  await prisma.assignedGame.updateMany({
    where: { gameId: id, userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    data: { status: 'COMPLETED', completedAt: finishedAt },
  });

  // Пишем событие в Activity
  const game = await prisma.game.findUnique({ where: { id }, select: { title: true } });
  await prisma.activity.create({
    data: {
      userId,
      eventType: 'game_completed',
      metadata: {
        gameId: id,
        sessionId,
        gameTitle: game?.title || '',
        percent,
        correctCount,
        totalItems,
        durationSec,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    result: {
      percent,
      correctCount,
      wrongCount,
      skippedCount,
      totalItems,
      durationSec,
    },
  });
}