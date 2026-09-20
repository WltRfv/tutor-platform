import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId');

  const topics = await prisma.topic.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
    include: {
      subject: { select: { name: true, code: true } },
      _count: {
        select: { notes: true, tests: true, homeworks: true },
      },
    },
  });

  return NextResponse.json(topics);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { subjectId, title, description, order } = await req.json();

  if (!subjectId || !title) {
    return NextResponse.json({ error: 'Заполни предмет и название' }, { status: 400 });
  }

  const topic = await prisma.topic.create({
    data: {
      subjectId,
      title,
      description: description || null,
      order: typeof order === 'number' ? order : 0,
    },
  });

  return NextResponse.json({ ok: true, topic });
}