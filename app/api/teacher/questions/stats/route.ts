import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const [bySubject, topicsGrouped, byType, subjects] = await Promise.all([
    prisma.question.groupBy({
      by: ['subjectId'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.question.groupBy({
      by: ['subjectId', 'topic'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.question.groupBy({
      by: ['type'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.subjects.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, category: true, grade: true },
    }),
  ]);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  return NextResponse.json({
    bySubject: bySubject.map((b) => ({
      subjectId: b.subjectId,
      subjectName: subjectMap.get(b.subjectId)?.name || '—',
      count: b._count,
    })),
    topics: topicsGrouped.map((t) => ({
      subjectId: t.subjectId,
      subjectName: subjectMap.get(t.subjectId)?.name || '—',
      subjectGrade: subjectMap.get(t.subjectId)?.grade ?? null,
      topic: t.topic,
      count: t._count,
    })),
    byType: byType.map((t) => ({
      type: t.type,
      count: t._count,
    })),
    total: bySubject.reduce((sum, b) => sum + b._count, 0),
  });
}