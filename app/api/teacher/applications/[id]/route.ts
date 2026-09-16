import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED' },
  });

  try {
    if (action === 'approve') {
      await sendTelegramNotification(
        `✅ <b>Заявка одобрена</b>\n\n👤 ${user.name}\n📧 ${user.email}`
      );
    } else {
      await sendTelegramNotification(
        `❌ <b>Заявка отклонена</b>\n\n👤 ${user.name}\n📧 ${user.email}`
      );
    }
  } catch {}

  return NextResponse.json({ ok: true });
}