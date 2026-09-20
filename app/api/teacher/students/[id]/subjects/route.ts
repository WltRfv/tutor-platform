import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { subjectId } = await req.json();

  if (!subjectId) {
    return NextResponse.json({ error: 'Не выбран предмет' }, { status: 400 });
  }

  // Проверяем, что предмет существует
  const subject = await prisma.subjects.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: 'Предмет не найден' }, { status: 404 });
  }

  // Проверяем, что он ещё не добавлен
  const existing = await prisma.userSubject.findUnique({
    where: {
      userId_subjectId: { userId: id, subjectId },
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Уже добавлен' }, { status: 400 });
  }

  const userSubject = await prisma.userSubject.create({
    data: {
      userId: id,
      subjectId,
      addedBy: 'TEACHER',
    },
    include: { subject: { select: { id: true, name: true, code: true } } },
  });

  return NextResponse.json({ ok: true, userSubject });
}