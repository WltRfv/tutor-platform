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
  const test = await prisma.test.findUnique({ where: { id } });

  if (!test) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  return NextResponse.json(test);
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
  const { title, subject, questions, timeLimit, published } = await req.json();

  if (!title || !subject || !questions?.length) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const test = await prisma.test.update({
    where: { id },
    data: {
      title,
      subject,
      questions,
      timeLimit: timeLimit || null,
      published: Boolean(published),
    },
  });

  return NextResponse.json({ ok: true, id: test.id });
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
  await prisma.test.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}