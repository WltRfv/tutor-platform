import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const teacherId = (session.user as any).id as string;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const subjectId = searchParams.get('subjectId');
  const template = searchParams.get('template');

  const where: any = { authorId: teacherId };
  if (type) where.type = type;
  if (subjectId) where.subjectId = subjectId;
  if (template === 'true') where.isTemplate = true;
  if (template === 'false') where.isTemplate = false;

  const games = await prisma.game.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      subject: { select: { name: true } },
      topic: { select: { title: true } },
      _count: { select: { items: true, sessions: true } },
    },
  });

  return NextResponse.json(
    games.map((g) => ({
      id: g.id,
      type: g.type,
      title: g.title,
      description: g.description,
      subjectId: g.subjectId,
      subjectName: g.subject.name,
      topicId: g.topicId,
      topicName: g.topic?.title || null,
      isTemplate: g.isTemplate,
      published: g.published,
      itemsCount: g._count.items,
      sessionsCount: g._count.sessions,
      createdAt: g.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const {
    type,
    title,
    description,
    subjectId,
    topicId,
    isTemplate,
    published,
    items,
  } = body;

  if (!type || !title || !subjectId) {
    return NextResponse.json(
      { error: 'Нужны type, title, subjectId' },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Нужен хотя бы один элемент игры' },
      { status: 400 }
    );
  }

  const game = await prisma.game.create({
    data: {
      type,
      title: String(title).slice(0, 200),
      description: description || null,
      subjectId,
      topicId: topicId || null,
      authorId: (session.user as any).id,
      isTemplate: !!isTemplate,
      published: !!published,
      items: {
        create: items.map((item: any, i: number) => ({
          order: i,
          payload: item.payload || {},
          questionId: item.questionId || null,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: game.id });
}