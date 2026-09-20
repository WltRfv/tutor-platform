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

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId: id },
    select: { subjectId: true },
  });
  const subjectIds = userSubjects.map((us) => us.subjectId);

  const topics = await prisma.topic.findMany({
    where: { subjectId: { in: subjectIds }, isActive: true },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
    include: {
      subject: { select: { id: true, name: true } },
      unlocks: { where: { userId: id }, select: { id: true, unlockedAt: true } },
      _count: { select: { notes: true, tests: true, homeworks: true } },
    },
  });

  const result = topics.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    order: t.order,
    subjectId: t.subjectId,
    subjectName: t.subject.name,
    isUnlocked: t.unlocks.length > 0,
    unlockedAt: t.unlocks[0]?.unlockedAt || null,
    counts: t._count,
  }));

  return NextResponse.json(result);
}