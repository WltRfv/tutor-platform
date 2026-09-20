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
  const unlocks = await prisma.topicUnlock.findMany({
    where: { topicId: id },
    select: { userId: true, unlockedAt: true },
  });

  return NextResponse.json(unlocks);
}