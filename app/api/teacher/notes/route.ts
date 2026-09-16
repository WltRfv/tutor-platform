import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { title, content, subject, topic, published } = await req.json();

  if (!title || !content || !subject) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      title,
      content,
      subject,
      topic: topic || null,
      published: Boolean(published),
      authorId: (session.user as any).id,
    },
  });

  return NextResponse.json({ ok: true, id: note.id });
}