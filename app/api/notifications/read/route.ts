import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userId = (session.user as any).id;
  const { type } = await req.json();

  if (!type) return NextResponse.json({ error: 'Не указан тип' }, { status: 400 });

  await prisma.notificationRead.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}