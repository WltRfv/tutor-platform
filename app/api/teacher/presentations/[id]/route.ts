import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function owned(id: string, teacherId: string) {
  return prisma.presentation.findFirst({ where: { id, authorId: teacherId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const p = await prisma.presentation.findFirst({
    where: { id, authorId: (session.user as any).id },
    include: {
      subject: { select: { name: true } },
      slides: { orderBy: { order: 'asc' } },
    },
  });
  if (!p) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  return NextResponse.json({
    id: p.id,
    title: p.title,
    subjectId: p.subjectId,
    subjectName: p.subject.name,
    topicId: p.topicId,
    topicName: p.topicName,
    imageUrl: p.imageUrl,
    published: p.published,
    slides: p.slides.map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title,
      content: s.content,
      imageUrl: s.imageUrl,
    })),
  });
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
  const existing = await owned(id, (session.user as any).id);
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { title, subjectId, topicId, imageUrl, published, slides } = body;

  await prisma.presentation.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(subjectId !== undefined && { subjectId }),
      ...(topicId !== undefined && { topicId: topicId || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(published !== undefined && { published: !!published }),
    },
  });

  if (Array.isArray(slides)) {
    // Удаляем все существующие слайды и создаём заново — просто и безопасно
    await prisma.slide.deleteMany({ where: { presentationId: id } });
    if (slides.length > 0) {
      await prisma.slide.createMany({
        data: slides.map((s: any, i: number) => ({
          presentationId: id,
          order: i,
          title: s.title || null,
          content: s.content || '',
          imageUrl: s.imageUrl || null,
        })),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await owned(id, (session.user as any).id);
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  await prisma.presentation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}