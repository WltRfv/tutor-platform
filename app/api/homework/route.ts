import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
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
  } = await req.json();

  if (!title || !subjectId) {
    return NextResponse.json(
      { error: 'Заполни заголовок и предмет' },
      { status: 400 }
    );
  }

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json({ error: 'Добавь хотя бы одну задачу' }, { status: 400 });
  }

  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i].text?.trim()) {
      return NextResponse.json(
        { error: `Задача ${i + 1}: пустое условие` },
        { status: 400 }
      );
    }
  }

  if (targetType === 'SPECIFIC' && !targetUserId) {
    return NextResponse.json({ error: 'Выбери ученика' }, { status: 400 });
  }

  const homework = await prisma.homework.create({
    data: {
      title,
      description: description || null,
      subjectId,
      topicId: topicId || null,
      imageUrl: imageUrl || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      targetType: targetType || 'ALL',
      targetUserId: targetType === 'SPECIFIC' ? targetUserId : null,
      teacherId: (session.user as any).id,
      tasks: {
        create: tasks.map((t: any, i: number) => ({
          order: i,
          text: t.text,
          imageUrl: t.imageUrl || null,
          correctAnswer: t.correctAnswer?.trim() || null,
          answerType: t.answerType || 'TEXT',
          points: t.points || 1,
        })),
      },
    },
    include: {
      targetUser: { select: { name: true } },
      _count: { select: { tasks: true } },
    },
  });

  try {
    let recipient = '🌍 Всем ученикам';
    if (homework.targetType === 'SPECIFIC' && homework.targetUser) {
      recipient = `👤 ${homework.targetUser.name}`;
    }
    await sendTelegramNotification(
      `📚 <b>Новое задание</b>\n\n📝 ${title}\n📋 Задач: ${homework._count.tasks}\n${recipient}${dueDate ? `\n⏰ до ${new Date(dueDate).toLocaleDateString('ru-RU')}` : ''}`
    );
  } catch {}

  return NextResponse.json({ ok: true, homework });
}