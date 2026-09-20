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
  const note = await prisma.note.findUnique({
    where: { id },
    include: { subject: { select: { name: true } } },
  });

  if (!note) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  return NextResponse.json(note);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { title, content, subjectId, topicId, imageUrl, published } = await req.json();

  if (!title || !content || !subjectId) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  

  const note = await prisma.note.update({
    where: { id },
    data: {
      title,
      content,
      subjectId,
      topicId: topicId || null,
      imageUrl: imageUrl || null,
      published: Boolean(published),
    },
  });

  return NextResponse.json({ ok: true, id: note.id });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}