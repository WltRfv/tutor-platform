import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

function checkAnswer(
  userAnswer: string,
  correct: string,
  type: string
): { passed: boolean; message: string } {
  const ua = userAnswer.trim();
  const ca = correct.trim();

  if (!ua) return { passed: false, message: 'Нет ответа' };

  if (type === 'NUMBER') {
    const uaNum = parseFloat(ua.replace(',', '.'));
    const caNum = parseFloat(ca.replace(',', '.'));
    if (isNaN(uaNum) || isNaN(caNum)) {
      return { passed: false, message: 'Не удалось сравнить числа' };
    }
    if (Math.abs(uaNum - caNum) < 0.0001) {
      return { passed: true, message: 'Верно!' };
    }
    return { passed: false, message: `Ожидалось: ${ca}` };
  }

  if (type === 'EXACT') {
    if (ua === ca) return { passed: true, message: 'Верно!' };
    return { passed: false, message: 'Неточный ответ' };
  }

  const norm = (s: string) =>
    s.toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:]/g, '').trim();
  if (norm(ua) === norm(ca)) return { passed: true, message: 'Верно!' };
  return { passed: false, message: 'Ответ не совпадает' };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'STUDENT') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const {
    homeworkId,
    boardData,
    previewUrl,
    files,
    textAnswer,
    taskAnswers,
    taskCodes,
    taskCodesMetrics,
  } = await req.json();

  if (!homeworkId) {
    return NextResponse.json({ error: 'Не указано задание' }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  if (!homework) {
    return NextResponse.json({ error: 'Задание не найдено' }, { status: 404 });
  }

  const checks: Record<
    string,
    { answer: string; passed: boolean | null; message: string | null }
  > = {};
  let score = 0;
  let total = 0;

  for (const task of homework.tasks) {
    const isCodeTask = !!task.language;
    const userAnswer = isCodeTask
      ? ((taskCodes?.[task.id] as string) || '').trim()
      : ((taskAnswers?.[task.id] as string) || '').trim();

    if (task.correctAnswer && !isCodeTask) {
      total++;
      if (userAnswer) {
        const result = checkAnswer(
          userAnswer,
          task.correctAnswer,
          task.answerType
        );
        checks[task.id] = {
          answer: userAnswer,
          passed: result.passed,
          message: result.message,
        };
        if (result.passed) score++;
      } else {
        checks[task.id] = { answer: '', passed: false, message: 'Нет ответа' };
      }
    } else {
      checks[task.id] = {
        answer: userAnswer,
        passed: null,
        message: isCodeTask && userAnswer ? 'Код отправлен на проверку' : null,
      };
    }
  }

  const hasContent =
    boardData ||
    (files && files.length > 0) ||
    (textAnswer && textAnswer.trim()) ||
    Object.values(checks).some((c) => c.answer);

  if (!hasContent) {
    return NextResponse.json(
      { error: 'Добавь хотя бы один ответ' },
      { status: 400 }
    );
  }

  // Считаем время выполнения
  const start = await prisma.homeworkStart.findUnique({
    where: { homeworkId_userId: { homeworkId, userId } },
  });
  const timeSpent = start
    ? Math.round((Date.now() - start.startedAt.getTime()) / 1000)
    : null;

  const lastSubmission = await prisma.homeworkSubmission.findFirst({
    where: { homeworkId, userId },
    orderBy: { version: 'desc' },
  });
  const newVersion = (lastSubmission?.version || 0) + 1;

  const allPassed = total > 0 && score === total;
  const autoCheckPassed = total > 0 ? allPassed : null;
  const autoCheckMessage =
    total > 0 ? `Верных ответов: ${score} из ${total}` : null;

  const submission = await prisma.homeworkSubmission.create({
    data: {
      homeworkId,
      userId,
      version: newVersion,
      boardData: boardData || null,
      previewUrl: previewUrl || null,
      files: files || null,
      textAnswer: textAnswer || null,
      taskAnswers: checks,
      taskCodes: taskCodes || null,
      taskCodesMetrics: taskCodesMetrics || null,
      timeSpent,
      autoCheckPassed,
      autoCheckMessage,
      autoScore: total > 0 ? score : null,
      autoTotal: total > 0 ? total : null,
      status: 'SUBMITTED',
    },
  });

  try {
    let autoInfo = '';
    if (total > 0) autoInfo = `\n📊 Автопроверка: ${score} из ${total}`;
    let timeInfo = '';
    if (timeSpent !== null) {
      const mins = Math.floor(timeSpent / 60);
      timeInfo = `\n⏱ Потратил: ${mins} мин`;
    }
    await sendTelegramNotification(
      `📥 <b>Новая сдача ДЗ</b>\n\n👤 ${session.user.name}\n📝 ${homework.title}\n🔢 Версия: v${newVersion}${autoInfo}${timeInfo}`
    );
  } catch {}

  return NextResponse.json({ ok: true, submission });
}