import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"'«»]/g, '');
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const userId = (session.user as any).id as string;
  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { sessionId, itemId, timeSpentMs } = body;
  if (!sessionId || !itemId)
    return NextResponse.json({ error: 'Нужны sessionId и itemId' }, { status: 400 });

  const sessionRow = await prisma.gameSession.findFirst({
    where: { id: sessionId, userId, gameId: id },
  });
  if (!sessionRow)
    return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  if (sessionRow.status !== 'IN_PROGRESS')
    return NextResponse.json({ error: 'Сессия завершена' }, { status: 400 });

  const [game, item] = await Promise.all([
    prisma.game.findUnique({ where: { id }, select: { type: true } }),
    prisma.gameItem.findFirst({
      where: { id: itemId, gameId: id },
      select: { id: true, payload: true },
    }),
  ]);
  if (!game || !item)
    return NextResponse.json({ error: 'Элемент не найден' }, { status: 404 });

  const a = body.answer ?? {};
  let isCorrect: boolean | null = null;
  let selfMarked: boolean | null = null;

  switch (game.type) {
    case 'CARDS':
      if (typeof body.selfMarked === 'boolean') selfMarked = body.selfMarked;
      break;
    case 'MATCHING':
      if (typeof body.isCorrect === 'boolean') isCorrect = body.isCorrect;
      else if (typeof a.selectedRightId === 'string')
        isCorrect = a.selectedRightId === item.id;
      break;
    case 'HINTS': {
      if (typeof body.selfMarked === 'boolean') selfMarked = body.selfMarked;
      else if (typeof body.isCorrect === 'boolean') isCorrect = body.isCorrect;
      else {
        const p = item.payload as any;
        isCorrect =
          normalize(String(a.userAnswer ?? '')) ===
          normalize(String(p?.answer ?? ''));
      }
      break;
    }
    case 'FIND_ERROR': {
      const p = item.payload as any;
      const v = a.verdict;
      if (v === 'error' || v === 'ok')
        isCorrect = v === (p?.hasError ? 'error' : 'ok');
      break;
    }
    case 'QUIZ':
    case 'TRAINER': {
      const p = item.payload as any;
      const sel = a.selectedIndex;
      if (typeof sel === 'number' && typeof p?.correct === 'number')
        isCorrect = sel === p.correct;
      break;
    }
    default:
      break;
  }

  const points = isCorrect === true || selfMarked === true ? 1 : 0;
  const existing = await prisma.gameAnswer.findFirst({
    where: { sessionId, itemId },
  });

  if (existing) {
    await prisma.gameAnswer.update({
      where: { id: existing.id },
      data: { answer: a, isCorrect, selfMarked, points, timeSpentMs: timeSpentMs || null },
    });
  } else {
    await prisma.gameAnswer.create({
      data: { sessionId, itemId, answer: a, isCorrect, selfMarked, points, timeSpentMs: timeSpentMs || null },
    });
  }

  return NextResponse.json({ ok: true, isCorrect });
}