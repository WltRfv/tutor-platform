import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function getSectionNumber(title: string): number {
  const m = title.match(/§\s*(\d+(?:[.,]\d+)?)/);
  if (m) return parseFloat(m[1].replace(',', '.'));
  const m2 = title.match(/^(\d+(?:[.,]\d+)?)\s*[.)]/);
  if (m2) return parseFloat(m2[1].replace(',', '.'));
  return 999999;
}

function sortBySection<T extends { title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const na = getSectionNumber(a.title);
    const nb = getSectionNumber(b.title);
    if (na !== nb) return na - nb;
    return a.title.localeCompare(b.title, 'ru');
  });
}

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
    }),
    prisma.test.findMany({
      where: { topicId: id, published: true },
      select: { id: true, title: true },
    }),
    prisma.homework.findMany({
      where: { topicId: id },
      select: { id: true, title: true },
    }),
    prisma.presentation.findMany({
      where: { topicId: id, published: true },
      select: { id: true, title: true },
    }),
    prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: id, userId } },
      select: { contentIds: true, unlockedAt: true },
    }),
  ]);

  const isUnlocked = !!unlock;
  const raw = (unlock?.contentIds as unknown) as string[] | null | undefined;
  const selected = Array.isArray(raw) ? raw : null;

  return NextResponse.json({
    topic: { id: topic.id, title: topic.title },
    isUnlocked,
    selectedContentIds: selected,
    notes: sortBySection(notes),
    tests: sortBySection(tests),
    homeworks: sortBySection(homeworks),
    presentations: sortBySection(presentations),
  });
}