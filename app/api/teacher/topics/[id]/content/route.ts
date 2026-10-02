import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Не указан userId' }, { status: 400 });
  }

  const topic = await prisma.topic.findUnique({
    where: { id },
    select: { id: true, title: true, subjectId: true },
  });
  if (!topic) {
    return NextResponse.json({ error: 'Тема не найдена' }, { status: 404 });
  }

  const [notes, tests, homeworks, presentations, unlock] = await Promise.all([
    prisma.note.findMany({
      where: { topicId: id, published: true },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.test.findMany({
      where: { topicId: id, published: true },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.homework.findMany({
      where: { topicId: id },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.presentation.findMany({
      where: { topicId: id, published: true },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: id, userId } },
      select: { contentIds: true, unlockedAt: true },
    }),
  ]);

  const isUnlocked = !!unlock;
  const raw = (unlock?.contentIds as unknown) as string[] | null | undefined;
  const selected = Array.isArray(raw) ? raw : null; // null = всё доступно

  return NextResponse.json({
    topic: { id: topic.id, title: topic.title },
    isUnlocked,
    selectedContentIds: selected,
    notes,
    tests,
    homeworks,
    presentations,
  });
}