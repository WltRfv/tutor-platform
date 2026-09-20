import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id, subjectId } = await params;

  await prisma.userSubject.delete({
    where: {
      userId_subjectId: { userId: id, subjectId },
    },
  });

  return NextResponse.json({ ok: true });
}