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
  const { messengerLink } = await req.json();

  const student = await prisma.user.update({
    where: { id },
    data: { messengerLink: messengerLink?.trim() || null },
  });

  return NextResponse.json({ ok: true, messengerLink: student.messengerLink });
}