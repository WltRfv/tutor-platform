
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/src/generated/prisma/client';

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"'«»]/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Нет доступа' },
        { status: 403 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Не удалось определить пользователя' },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Неверный JSON' },
        { status: 400 }
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: 'Неверный формат данных' },
        { status: 400 }
      );
    }

    const { sessionId, itemId, timeSpentMs } = body;

    if (
      typeof sessionId !== 'string' ||
      !sessionId ||
      typeof itemId !== 'string' ||
      !itemId
    ) {
      return NextResponse.json(
        { error: 'Нужны sessionId и itemId' },
        { status: 400 }
      );
    }

    if (
      timeSpentMs !== undefined &&
      timeSpentMs !== null &&
      (
        typeof timeSpentMs !== 'number' ||
        !Number.isFinite(timeSpentMs) ||
        timeSpentMs < 0
      )
    ) {
      return NextResponse.json(
        { error: 'timeSpentMs должен быть неотрицательным числом' },
        { status: 400 }
      );
    }

    const answer = isRecord(body.answer) ? body.answer : {};

    const sessionRow = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId,
        gameId: id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!sessionRow) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    if (sessionRow.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Сессия завершена' },
        { status: 400 }
      );
    }

    const [game, item] = await Promise.all([
      prisma.game.findUnique({
        where: { id },
        select: { type: true },
      }),
      prisma.gameItem.findFirst({
        where: {
          id: itemId,
          gameId: id,
        },
        select: {
          id: true,
          payload: true,
        },
      }),
    ]);

    if (!game || !item) {
      return NextResponse.json(
        { error: 'Игра или элемент не найдены' },
        { status: 404 }
      );
    }

    const payload = isRecord(item.payload) ? item.payload : {};

    let isCorrect: boolean | null = null;
    let selfMarked: boolean | null = null;

    switch (game.type) {
      case 'CARDS': {
        if (typeof body.selfMarked === 'boolean') {
          selfMarked = body.selfMarked;
        }
        break;
      }

      case 'MATCHING': {
        const selectedRightId = answer.selectedRightId;

        if (typeof selectedRightId === 'string') {
          isCorrect = selectedRightId === item.id;
        }
        break;
      }

      case 'HINTS': {
        if (typeof body.selfMarked === 'boolean') {
          selfMarked = body.selfMarked;
        } else if (typeof answer.userAnswer === 'string') {
          isCorrect =
            normalize(answer.userAnswer) ===
            normalize(String(payload.answer ?? ''));
        }
        break;
      }

      case 'FIND_ERROR': {
        const verdict = answer.verdict;

        if (verdict === 'error' || verdict === 'ok') {
          isCorrect =
            verdict === (payload.hasError === true ? 'error' : 'ok');
        }
        break;
      }

      case 'QUIZ':
      case 'TRAINER': {
        const selectedIndex = answer.selectedIndex;
        const correctIndex = payload.correct;

        if (
          typeof selectedIndex === 'number' &&
          Number.isInteger(selectedIndex) &&
          typeof correctIndex === 'number' &&
          Number.isInteger(correctIndex)
        ) {
          isCorrect = selectedIndex === correctIndex;
        }
        break;
      }

      default: {
        return NextResponse.json(
          { error: 'Для этого типа игры проверка ответов не настроена' },
          { status: 400 }
        );
      }
    }

    const points =
      isCorrect === true || selfMarked === true ? 1 : 0;

    const normalizedTime =
      typeof timeSpentMs === 'number'
        ? Math.round(timeSpentMs)
        : null;

    const existing = await prisma.gameAnswer.findFirst({
      where: {
        sessionId,
        itemId,
      },
      select: { id: true },
    });

    const answerData = {
        answer: answer as Prisma.InputJsonValue,
        isCorrect,
        selfMarked,
        points,
        timeSpentMs: normalizedTime,
    };

    if (existing) {
        await prisma.gameAnswer.update({
            where: { id: existing.id },
            data: answerData,
        });
        } else {
        await prisma.gameAnswer.create({
            data: {
            sessionId,
            itemId,
            ...answerData,
            },
        });
    }

    return NextResponse.json({
      ok: true,
      isCorrect,
      selfMarked,
      points,
    });
  } catch (error) {
    console.error('Ошибка сохранения ответа:', error);

    return NextResponse.json(
      { error: 'Не удалось сохранить ответ' },
      { status: 500 }
    );
  }
}
