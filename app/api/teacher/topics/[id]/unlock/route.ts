import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function normalizeContentIds(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0)
    .filter((v) => /^(note|test|homework|presentation):/.test(v));
  return Array.from(new Set(cleaned));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { userId } = body as { userId?: string };

  if (!userId) {
    return NextResponse.json({ error: 'Не указан ученик' }, { status: 400 });
  }

  // contentIds — либо массив, либо отсутствует (= всё доступно)
  const contentIds = normalizeContentIds(body.contentIds);

  await prisma.topicUnlock.upsert({
    where: { topicId_userId: { topicId: id, userId } },
    create: {
      topicId: id,
      userId,
      contentIds: contentIds === null ? undefined : contentIds,
    },
    update: {
      contentIds: contentIds === null ? undefined : contentIds,
    },
  });

  return NextResponse.json({ ok: true });
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
  const body = await req.json().catch(() => ({}));
  const { userId } = body as { userId?: string };

  if (!userId) {
    return NextResponse.json({ error: 'Не указан ученик' }, { status: 400 });
  }

  const contentIds = normalizeContentIds(body.contentIds);
  if (contentIds === null) {
    return NextResponse.json({ error: 'contentIds должен быть массивом' }, { status: 400 });
  }

  const existing = await prisma.topicUnlock.findUnique({
    where: { topicId_userId: { topicId: id, userId } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Тема не открыта' }, { status: 404 });
  }

  await prisma.topicUnlock.update({
    where: { topicId_userId: { topicId: id, userId } },
    data: { contentIds },
  });

  return NextResponse.json({ ok: true });
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
  const body = await req.json().catch(() => ({}));
  const { userId } = body as { userId?: string };

  if (!userId) {
    return NextResponse.json({ error: 'Не указан ученик' }, { status: 400 });
  }

  await prisma.topicUnlock
    .delete({
      where: { topicId_userId: { topicId: id, userId } },
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}