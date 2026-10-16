import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function owned(id: string, teacherId: string) {
  return prisma.game.findFirst({ where: { id, authorId: teacherId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const game = await prisma.game.findFirst({
    where: { id, authorId: (session.user as any).id },
    include: {
      subject: { select: { name: true } },
      topic: { select: { title: true } },
      items: { orderBy: { order: 'asc' } },
    },
  });
  if (!game) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  return NextResponse.json({
    id: game.id,
    type: game.type,
    title: game.title,
    description: game.description,
    subjectId: game.subjectId,
    subjectName: game.subject.name,
    topicId: game.topicId,
    topicName: game.topic?.title || null,
    isTemplate: game.isTemplate,
    published: game.published,
    items: game.items.map((it) => ({
      id: it.id,
      order: it.order,
      payload: it.payload,
      questionId: it.questionId,
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const owned_ = await owned(id, (session.user as any).id);
  if (!owned_) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { title, description, topicId, isTemplate, published, items } = body;

  await prisma.game.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: String(title).slice(0, 200) }),
      ...(description !== undefined && { description: description || null }),
      ...(topicId !== undefined && { topicId: topicId || null }),
      ...(isTemplate !== undefined && { isTemplate: !!isTemplate }),
      ...(published !== undefined && { published: !!published }),
    },
  });

  if (Array.isArray(items)) {
    await prisma.gameItem.deleteMany({ where: { gameId: id } });
    if (items.length > 0) {
      await prisma.gameItem.createMany({
        data: items.map((item: any, i: number) => ({
          gameId: id,
          order: i,
          payload: item.payload || {},
          questionId: item.questionId || null,
        })),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const owned_ = await owned(id, (session.user as any).id);
  if (!owned_) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  await prisma.game.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}