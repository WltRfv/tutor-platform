import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { status, teacherNote } = await req.json();

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });
  }

  const request = await prisma.retakeRequest.update({
    where: { id },
    data: {
      status,
      teacherNote: teacherNote || null,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, request });
}