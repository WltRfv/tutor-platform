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

  const { sessionId, itemId, answer, selfMarked, timeSpentMs } = body;

  if (!sessionId || !itemId) {
    return NextResponse.json({ error: 'Нужны sessionId и itemId' }, { status: 400 });
  }

  // Проверяем, что сессия принадлежит этому ученику и относится к этой игре
  const sessionRow = await prisma.gameSession.findFirst({
    where: { id: sessionId, userId, gameId: id },
  });
  if (!sessionRow) {
    return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  }
  if (sessionRow.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Сессия завершена' }, { status: 400 });
  }

  // Проверяем, что item принадлежит этой игре
  const item = await prisma.gameItem.findFirst({
    where: { id: itemId, gameId: id },
  });
  if (!item) {
    return NextResponse.json({ error: 'Элемент не найден' }, { status: 404 });
  }

  const wasCorrect = typeof selfMarked === 'boolean' ? selfMarked : null;

  const existing = await prisma.gameAnswer.findFirst({
    where: { sessionId, itemId },
  });

  if (existing) {
    await prisma.gameAnswer.update({
      where: { id: existing.id },
      data: {
        answer: answer ?? null,
        selfMarked: wasCorrect,
        isCorrect: null,
        timeSpentMs: timeSpentMs || null,
      },
    });
  } else {
    await prisma.gameAnswer.create({
      data: {
        sessionId,
        itemId,
        answer: answer ?? null,
        selfMarked: wasCorrect,
        isCorrect: null,
        points: 0,
        timeSpentMs: timeSpentMs || null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}