import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function canAccess(userId: string, noteId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, subjectId: true, topicId: true, published: true },
  });
  if (!note || !note.published) return null;

  const userSub = await prisma.userSubject.findFirst({
    where: { userId, subjectId: note.subjectId },
  });
  if (!userSub) return null;

  if (note.topicId) {
    const unlock = await prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: note.topicId, userId } },
    });
    if (!unlock) return null;
    const raw = (unlock.contentIds as unknown) as string[] | null | undefined;
    if (Array.isArray(raw) && !raw.includes(`note:${noteId}`)) return null;
  }

  return note;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const userId = (session.user as any).id as string;
  const { id } = await params;

  const access = await canAccess(userId, id);
  if (!access) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!answer) return NextResponse.json({ error: 'Пустой ответ' }, { status: 400 });

  const existing = await prisma.selfWorkStatus.findUnique({
    where: { noteId_userId: { noteId: id, userId } },
  });

  if (existing?.status === 'PASSED') {
    return NextResponse.json(
      { error: 'Работа уже зачтена, повторная отправка не нужна' },
      { status: 400 }
    );
  }

  const updated = await prisma.selfWorkStatus.upsert({
    where: { noteId_userId: { noteId: id, userId } },
    create: {
      noteId: id,
      userId,
      status: 'SUBMITTED',
      studentAnswer: answer,
    },
    update: {
      status: 'SUBMITTED',
      studentAnswer: answer,
      reviewedAt: null,
    },
  });

  return NextResponse.json({ ok: true, status: updated });
}