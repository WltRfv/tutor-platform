
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    if (
      typeof body !== 'object' ||
      body === null ||
      !('sessionId' in body) ||
      typeof body.sessionId !== 'string' ||
      !body.sessionId
    ) {
      return NextResponse.json(
        { error: 'Нужен sessionId' },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId;

    const sessionRow = await prisma.gameSession.findFirst({
      where: {
        id: sessionId,
        userId,
        gameId: id,
      },
      include: {
        answers: {
          orderBy: { createdAt: 'desc' },
        },
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
        { error: 'Сессия уже завершена' },
        { status: 400 }
      );
    }

    const totalItems = await prisma.gameItem.count({
      where: { gameId: id },
    });

    // Ответы упорядочены от новых к старым.
    // Оставляем только одну, последнюю запись на элемент.
    const latestAnswers = new Map<
      string,
      (typeof sessionRow.answers)[number]
    >();

    for (const answer of sessionRow.answers) {
      if (answer.itemId && !latestAnswers.has(answer.itemId)) {
        latestAnswers.set(answer.itemId, answer);
      }
    }

    let correctCount = 0;
    let wrongCount = 0;

    for (const answer of latestAnswers.values()) {
      const isCorrect =
        answer.isCorrect === true || answer.selfMarked === true;

      const isWrong =
        answer.isCorrect === false || answer.selfMarked === false;

      if (isCorrect) {
        correctCount++;
      } else if (isWrong) {
        wrongCount++;
      }
    }

    const answeredCount = latestAnswers.size;

    const skippedCount = Math.max(
      0,
      totalItems - answeredCount
    );

    const percent =
      totalItems > 0
        ? Math.round((correctCount / totalItems) * 100)
        : 0;

    const finishedAt = new Date();

    const durationSec = Math.max(
      0,
      Math.round(
        (finishedAt.getTime() - sessionRow.startedAt.getTime()) / 1000
      )
    );

    const result = {
      percent,
      correctCount,
      wrongCount,
      skippedCount,
      totalItems,
      durationSec,
    };

    await prisma.$transaction(async (tx) => {
      // Повторно проверяем статус перед изменением,
      // чтобы не завершить уже завершённую сессию.
      const update = await tx.gameSession.updateMany({
        where: {
          id: sessionId,
          userId,
          gameId: id,
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'FINISHED',
          finishedAt,
          score: correctCount,
          totalPoints: totalItems,
          percent,
          correctCount,
          wrongCount,
          skippedCount,
          durationSec,
        },
      });

      if (update.count !== 1) {
        throw new Error('SESSION_ALREADY_FINISHED');
      }

      await tx.assignedGame.updateMany({
        where: {
          gameId: id,
          userId,
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
        data: {
          status: 'COMPLETED',
          completedAt: finishedAt,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'SESSION_ALREADY_FINISHED'
    ) {
      return NextResponse.json(
        { error: 'Сессия уже завершена' },
        { status: 400 }
      );
    }

    console.error('Ошибка завершения игры:', error);

    return NextResponse.json(
      { error: 'Не удалось завершить игру' },
      { status: 500 }
    );
  }
}
