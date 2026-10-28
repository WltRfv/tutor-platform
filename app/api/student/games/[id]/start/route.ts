
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkGameAccess } from '@/lib/game-access';

export async function POST(
  _req: Request,
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

    const access = await checkGameAccess(id, userId);

    if (!access.ok) {
      return NextResponse.json(
        {
          error:
            access.reason === 'not_found'
              ? 'Игра не найдена'
              : 'Нет доступа к игре',
        },
        {
          status: access.reason === 'not_found' ? 404 : 403,
        }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Игра не найдена' },
        { status: 404 }
      );
    }

    if (game.items.length === 0) {
      return NextResponse.json(
        { error: 'В игре пока нет заданий' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sessionRow = await tx.gameSession.create({
        data: {
          gameId: id,
          userId,
          status: 'IN_PROGRESS',
        },
      });

      await tx.assignedGame.updateMany({
        where: {
          gameId: id,
          userId,
          status: 'PENDING',
        },
        data: {
          status: 'IN_PROGRESS',
        },
      });

      return sessionRow;
    });

    return NextResponse.json({
      ok: true,
      sessionId: result.id,
      game: {
        id: game.id,
        type: game.type,
        title: game.title,
        settings: game.settings,
      },
      items: game.items.map((item) => ({
        id: item.id,
        order: item.order,
        payload: item.payload,
        questionId: item.questionId,
      })),
    });
  } catch (error) {
    console.error('Ошибка запуска игры:', error);

    return NextResponse.json(
      { error: 'Не удалось запустить игру' },
      { status: 500 }
    );
  }
}
