import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

async function ownedHomework(id: string, teacherId: string) {
  return prisma.homework.findFirst({ where: { id, teacherId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const teacherId = (session.user as any).id as string;
  const homework = await ownedHomework(id, teacherId);
  if (!homework) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  const full = await prisma.homework.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { order: 'asc' } },
    },
  });

  return NextResponse.json(full);
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
  const teacherId = (session.user as any).id as string;
  const existing = await ownedHomework(id, teacherId);
  if (!existing) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const {
    title,
    description,
    subjectId,
    topicId,
    imageUrl,
    dueDate,
    targetType,
    targetUserId,
    tasks,
  } = body;

  // Обновляем основные поля
  await prisma.homework.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description: description || null }),
      ...(subjectId !== undefined && { subjectId }),
      ...(topicId !== undefined && { topicId: topicId || null }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      ...(targetType !== undefined && { targetType }),
      ...(targetUserId !== undefined && {
        targetUserId: targetUserId || null,
      }),
    },
  });

  // Обрабатываем задачи, если переданы
  if (Array.isArray(tasks)) {
    const existingTasks = await prisma.homeworkTask.findMany({
      where: { homeworkId: id },
      select: { id: true },
    });
    const existingIds = new Set(existingTasks.map((t) => t.id));
    const incomingIds = new Set(
      tasks.filter((t: any) => t.id && existingIds.has(t.id)).map((t: any) => t.id)
    );

    // Удаляем те, что были, но не пришли
    const toDelete = existingTasks
      .filter((t) => !incomingIds.has(t.id))
      .map((t) => t.id);
    if (toDelete.length > 0) {
      await prisma.homeworkTask.deleteMany({ where: { id: { in: toDelete } } });
    }

    // Upsert каждой задачи
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const payload = {
        homeworkId: id,
        order: i,
        text: String(t.text || ''),
        imageUrl: t.imageUrl || null,
        correctAnswer: t.correctAnswer || null,
        answerType: t.answerType || 'TEXT',
        points: Number(t.points) || 1,
        language: t.language || null,
        starterCode: t.starterCode || null,
      };

      if (t.id && existingIds.has(t.id)) {
        await prisma.homeworkTask.update({ where: { id: t.id }, data: payload });
      } else {
        await prisma.homeworkTask.create({ data: payload });
      }
    }
  }

  const updated = await prisma.homework.findUnique({
    where: { id },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  return NextResponse.json({ ok: true, homework: updated });
}