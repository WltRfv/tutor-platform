import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/google-calendar';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { subject: { select: { name: true } } },
  });

  if (!lesson) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  return NextResponse.json(lesson);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Получаем текущее занятие, чтобы узнать googleEventId
  const existing = await prisma.lesson.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.subjectId && { subjectId: body.subjectId }),
      ...(body.startAt && { startAt: new Date(body.startAt) }),
      ...(body.endAt && { endAt: new Date(body.endAt) }),
      ...(body.telemostLink !== undefined && { telemostLink: body.telemostLink }),
      ...(body.boardLink !== undefined && { boardLink: body.boardLink }),
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  // Обновляем событие в Google Calendar
  if (existing.googleEventId) {
    try {
      const description = [
        `Ученик: ${existing.user.name}`,
        lesson.telemostLink ? `Телемост: ${lesson.telemostLink}` : '',
        lesson.boardLink ? `Доска: ${lesson.boardLink}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      await updateCalendarEvent(existing.googleEventId, {
        title: `${lesson.title || 'Занятие'} — ${existing.user.name}`,
        description,
        startAt: new Date(lesson.startAt),
        endAt: new Date(lesson.endAt),
      });
    } catch (e) {
      console.error('[lesson] google update error:', e);
    }
  }

  return NextResponse.json({ ok: true, lesson });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({ where: { id } });

  // Удаляем событие из Google Calendar
  if (lesson?.googleEventId) {
    try {
      await deleteCalendarEvent(lesson.googleEventId);
    } catch (e) {
      console.error('[lesson] google delete error:', e);
    }
  }

  await prisma.lesson.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ ok: true });
}