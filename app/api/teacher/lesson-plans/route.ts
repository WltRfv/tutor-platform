import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId') || undefined;

  const plans = await prisma.lessonPlan.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      subject: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const {
    title,
    content,
    subjectId,
    topicId,
    topicName,
    duration,
    published,
  } = await req.json();

  if (!title || !content || !subjectId) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const plan = await prisma.lessonPlan.create({
    data: {
      title,
      content,
      subjectId,
      topicId: topicId || null,
      topicName: topicName || null,
      duration: duration || 45,
      published: Boolean(published),
      authorId: (session.user as any).id,
    },
  });

  return NextResponse.json({ ok: true, id: plan.id });
}