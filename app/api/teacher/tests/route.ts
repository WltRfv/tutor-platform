import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { title, subject, questions, timeLimit, published } = await req.json();

  if (!title || !subject || !questions?.length) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const test = await prisma.test.create({
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