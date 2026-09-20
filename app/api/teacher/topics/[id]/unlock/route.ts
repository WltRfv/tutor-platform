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
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Не указан ученик' }, { status: 400 });
  }

  await prisma.topicUnlock.upsert({
    where: { topicId_userId: { topicId: id, userId } },
    create: { topicId: id, userId },
    update: {},
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
  const { userId } = await req.json();

  await prisma.topicUnlock.delete({
    where: { topicId_userId: { topicId: id, userId } },
  });

  return NextResponse.json({ ok: true });
}