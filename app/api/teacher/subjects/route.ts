import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const subjects = await prisma.subjects.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, code: true, name: true, category: true, grade: true },
  });

  return NextResponse.json(subjects);
}