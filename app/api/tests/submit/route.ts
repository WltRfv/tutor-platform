import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { testId, answers, score } = await req.json();

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) return NextResponse.json({ error: 'Тест не найден' }, { status: 404 });

  await prisma.submission.create({
    data: {
      userId: (session.user as any).id,
      testId,
      answer: answers,
      score,
      status: 'DONE',
    },
  });

  try {
    await sendTelegramNotification(
      `📝 <b>Тест сдан</b>\n\n👤 ${session.user.name}\n📚 ${test.title}\n📊 Результат: <b>${score}%</b>`
    );
  } catch {}

  return NextResponse.json({ ok: true });
}