import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const VALID = ['PENDING', 'PASSED', 'FAILED'];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const teacherId = (session.user as any).id as string;

  const note = await prisma.note.findFirst({ where: { id, authorId: teacherId } });
  if (!note) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { userId, status, comment } = body as {
    userId?: string;
    status?: string;
    comment?: string;
  };

  if (!userId || !status) {
    return NextResponse.json({ error: 'Нужны userId и status' }, { status: 400 });
  }
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });
  }

  const updated = await prisma.selfWorkStatus.upsert({
    where: { noteId_userId: { noteId: id, userId } },
    create: {
      noteId: id,
      userId,
      status,
      teacherComment: comment || null,
      reviewedAt: status === 'PENDING' ? null : new Date(),
    },
    update: {
      status,
      teacherComment: comment ?? undefined,
      reviewedAt: status === 'PENDING' ? null : new Date(),
    },
  });

  return NextResponse.json({ ok: true, status: updated });
}