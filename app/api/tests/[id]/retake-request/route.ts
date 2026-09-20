import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'STUDENT') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { reason } = await req.json();
  const userId = (session.user as any).id;

  // Проверяем, нет ли уже активного запроса
  const existing = await prisma.retakeRequest.findFirst({
    where: { testId: id, userId, status: 'PENDING' },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Уже есть активный запрос' },
      { status: 400 }
    );
  }

  const test = await prisma.test.findUnique({
    where: { id },
    select: { title: true },
  });
  if (!test) {
    return NextResponse.json({ error: 'Тест не найден' }, { status: 404 });
  }

  const request = await prisma.retakeRequest.create({
    data: {
      testId: id,
      userId,
      reason: reason || null,
      status: 'PENDING',
    },
  });

  try {
    await sendTelegramNotification(
      `🔄 <b>Запрос на пересдачу</b>\n\n👤 ${session.user.name}\n📝 ${test.title}${reason ? `\n💬 ${reason}` : ''}`
    );
  } catch {}

  return NextResponse.json({ ok: true, request });
}