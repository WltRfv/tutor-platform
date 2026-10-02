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

  const presentationId =
    typeof body.presentationId === 'string' && body.presentationId.trim()
      ? body.presentationId.trim()
      : null;

  // Если передали id — проверим, что это своя презентация
  if (presentationId) {
    const p = await prisma.presentation.findFirst({
      where: { id: presentationId, authorId: teacherId },
      select: { id: true },
    });
    if (!p) {
      return NextResponse.json({ error: 'Презентация не найдена' }, { status: 404 });
    }
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { presentationId },
  });

  return NextResponse.json({ ok: true, note: updated });
}