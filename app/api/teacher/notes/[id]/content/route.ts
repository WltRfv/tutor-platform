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
  const teacherId = (session.user as any).id as string;

  const note = await prisma.note.findFirst({ where: { id, authorId: teacherId } });
  if (!note) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const patch: any = {};
  if (body.practiceContent !== undefined) {
    patch.practiceContent = body.practiceContent || null;
  }
  if (body.selfWorkContent !== undefined) {
    patch.selfWorkContent = body.selfWorkContent || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нечего менять' }, { status: 400 });
  }

  const updated = await prisma.note.update({ where: { id }, data: patch });
  return NextResponse.json({ ok: true, note: updated });
}