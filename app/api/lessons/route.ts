import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { createCalendarEvent } from '@/lib/google-calendar';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const {
    title,
    subjectId,
    startAt,
    endAt,
    telemostLink,
    boardLink,
    userId,
  } = await req.json();

  if (!subjectId || !startAt || !endAt) {
    return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
  }

  const role = (session.user as any).role;
  const currentId = (session.user as any).id;

  const targetUserId = role === 'TEACHER' ? userId : currentId;
  const teacherId = role === 'TEACHER' ? currentId : null;

  if (!targetUserId) {
    return NextResponse.json({ error: 'Не выбран ученик' }, { status: 400 });
  }

  // Создаём занятие в БД
  const lesson = await prisma.lesson.create({
    data: {
      title: title || 'Занятие',
      subjectId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      telemostLink: telemostLink || null,
      boardLink: boardLink || null,
      userId: targetUserId,
      teacherId,
    },
    include: {
      user: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  // Синхронизация с Google Calendar (только для учителя)
  if (role === 'TEACHER') {
    try {
      const description = [
        `Ученик: ${lesson.user.name}`,
        telemostLink ? `Телемост: ${telemostLink}` : '',
        boardLink ? `Доска: ${boardLink}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const eventId = await createCalendarEvent({
        title: `${lesson.title} — ${lesson.user.name}`,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      });

      if (eventId) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { googleEventId: eventId },
        });
      }
    } catch (e) {
      console.error('[lesson] google sync error:', e);
    }
  }

  // Telegram-уведомление
  if (role === 'TEACHER') {
    try {
      await sendTelegramNotification(
        `📅 <b>Новое занятие</b>\n\n👤 ${lesson.user.name}\n📚 ${lesson.subject.name}\n🕐 ${new Date(startAt).toLocaleString('ru-RU')}`
      );
    } catch {}
  }

  return NextResponse.json({ ok: true, lesson });
}