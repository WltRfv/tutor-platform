import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const items = await prisma.presentation.findMany({
    where: { authorId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { name: true } }, _count: { select: { slides: true } } },
  });

  return NextResponse.json(
    items.map((p) => ({
      id: p.id,
      title: p.title,
      subjectId: p.subjectId,
      subjectName: p.subject.name,
      topicId: p.topicId,
      topicName: p.topicName,
      imageUrl: p.imageUrl,
      published: p.published,
      slidesCount: p._count.slides,
      createdAt: p.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { title, subjectId, topicId, imageUrl, published, slides } = body;

  if (!title || !subjectId) {
    return NextResponse.json({ error: 'Нужны title и subjectId' }, { status: 400 });
  }

  const created = await prisma.presentation.create({
    data: {
      title,
      subjectId,
      topicId: topicId || null,
      imageUrl: imageUrl || null,
      published: !!published,
      authorId: (session.user as any).id,
      slides: {
        create: (slides || []).map((s: any, i: number) => ({
          order: i,
          title: s.title || null,
          content: s.content || '',
          imageUrl: s.imageUrl || null,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}