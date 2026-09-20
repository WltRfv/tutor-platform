import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { aiCheckHomework } from '@/lib/ai-checker';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      homework: {
        select: {
          title: true,
          description: true,
          subject: { select: { name: true } },
          tasks: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  }

  const taskAnswers = (submission.taskAnswers as any) || {};

  // Собираем ответы ученика в один текст
  const answerParts: string[] = [];
  for (const task of submission.homework.tasks) {
    const info = taskAnswers[task.id];
    if (info?.answer) {
      answerParts.push(
        `Задача ${task.order + 1}: ${task.text}\nОтвет: ${info.answer}`
      );
    }
  }

  if (submission.textAnswer) {
    answerParts.push(`Текстовый ответ: ${submission.textAnswer}`);
  }

  if (answerParts.length === 0) {
    return NextResponse.json(
      { error: 'Нет текстовых ответов для проверки ИИ' },
      { status: 400 }
    );
  }

  const studentAnswer = answerParts.join('\n\n');

  // Собираем правильные ответы
  const correctParts: string[] = [];
  for (const task of submission.homework.tasks) {
    if (task.correctAnswer) {
      correctParts.push(`Задача ${task.order + 1}: ${task.correctAnswer}`);
    }
  }

  const result = await aiCheckHomework({
    taskTitle: submission.homework.title,
    taskDescription: submission.homework.description || submission.homework.title,
    correctAnswer: correctParts.length ? correctParts.join('\n') : null,
    studentAnswer,
    subjectName: submission.homework.subject.name,
  });

  if (!result) {
    return NextResponse.json(
      { error: 'ИИ не смог проверить. Проверь DEEPSEEK_API_KEY' },
      { status: 500 }
    );
  }

  // Формируем итоговый текст
  const review = [
    `**Вердикт:** ${result.verdict}`,
    `**Оценка ИИ:** ${result.score}/100`,
    result.correctAnswer ? `\n**Правильный ответ:** ${result.correctAnswer}` : '',
    result.mistakes.length
      ? `\n**Ошибки:**\n${result.mistakes.map((m) => `• ${m}`).join('\n')}`
      : '',
    `\n**Объяснение:**\n${result.explanation}`,
  ]
    .filter(Boolean)
    .join('\n');

  // Сохраняем в БД
  await prisma.homeworkSubmission.update({
    where: { id },
    data: {
      aiReview: review,
      aiReviewScore: result.score,
      aiReviewedAt: new Date(),
    },
  });

  // Уведомляем в Telegram
  try {
    await sendTelegramNotification(
      `🤖 <b>ИИ проверил ДЗ</b>\n\n👤 ${submission.user.name}\n📝 ${submission.homework.title}\n📊 Оценка ИИ: <b>${result.score}/100</b>\n\n${result.verdict}`
    );
  } catch {}

  return NextResponse.json({
    ok: true,
    review,
    score: result.score,
    verdict: result.verdict,
    mistakes: result.mistakes,
    explanation: result.explanation,
    correctAnswer: result.correctAnswer,
  });
}