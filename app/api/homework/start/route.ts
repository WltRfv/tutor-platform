import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'STUDENT') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { homeworkId } = await req.json();
  if (!homeworkId) {
    return NextResponse.json({ error: 'Не указано задание' }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const start = await prisma.homeworkStart.upsert({
    where: { homeworkId_userId: { homeworkId, userId } },
    create: { homeworkId, userId },
    update: { lastActiveAt: new Date() },
  });

  return NextResponse.json({ ok: true, startedAt: start.startedAt });
}