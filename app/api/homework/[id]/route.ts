import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });

  const { id } = await params;

  const homework = await prisma.homework.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true } },
      subject: { select: { name: true } },
      targetUser: { select: { name: true } },
      submissions: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, grade: true } } },
      },
    },
  });

  if (!homework) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  return NextResponse.json(homework);
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
  await prisma.homework.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}