import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function ownedAttachment(id: string, ownerId: string) {
  return prisma.attachment.findFirst({ where: { id, ownerId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const ownerId = (session.user as any).id as string;
  const existing = await ownedAttachment(id, ownerId);
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const patch: any = {};
  if (typeof body.name === 'string' && body.name.trim()) {
    patch.name = body.name.trim().slice(0, 200);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нечего менять' }, { status: 400 });
  }

  const updated = await prisma.attachment.update({ where: { id }, data: patch });
  return NextResponse.json({ ok: true, attachment: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const ownerId = (session.user as any).id as string;
  const existing = await ownedAttachment(id, ownerId);
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}