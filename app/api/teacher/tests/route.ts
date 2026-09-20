import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const tests = await prisma.test.findMany({
    where: { teacherId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { name: true } } },
  });

  return NextResponse.json(tests);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const {
    title,
    subjectId,
    topicId,
    mode,
    questions,
    bankConfig,
    timeLimit,
    attemptsAllowed,
    published,
  } = await req.json();

  if (!title) {
    return NextResponse.json({ error: 'Введи название' }, { status: 400 });
  }

  if (!['MANUAL', 'BANK_CUSTOM'].includes(mode)) {
    return NextResponse.json({ error: 'Неверный режим' }, { status: 400 });
  }

  if (mode === 'MANUAL' && !subjectId) {
    return NextResponse.json({ error: 'Выбери предмет' }, { status: 400 });
  }

  let finalQuestions = questions;
  let finalSubjectId = subjectId;

  // === BANK_CUSTOM ===
  if (mode === 'BANK_CUSTOM') {
    const picks: { subjectId: string; topic: string }[] =
      bankConfig?.picks || [];

    if (picks.length === 0) {
      return NextResponse.json(
        { error: 'Выбери хотя бы одну тему из банка' },
        { status: 400 }
      );
    }

    if (!bankConfig?.count || bankConfig.count < 1) {
      return NextResponse.json(
        { error: 'Укажи количество вопросов' },
        { status: 400 }
      );
    }

    // Собираем вопросы из банка по всем выбранным (subjectId + topic)
    const where: any = {
      isActive: true,
      OR: picks.map((p) => ({ subjectId: p.subjectId, topic: p.topic })),
    };
    if (bankConfig.difficulty) where.difficulty = bankConfig.difficulty;
    if (bankConfig.types?.length) where.type = { in: bankConfig.types };

    const bankQuestions = await prisma.question.findMany({
      where,
      include: { subject: { select: { name: true } } },
    });

    if (bankQuestions.length < bankConfig.count) {
      return NextResponse.json(
        {
          error: `В банке только ${bankQuestions.length} подходящих вопросов по этим темам, а нужно ${bankConfig.count}`,
        },
        { status: 400 }
      );
    }

    // Случайная выборка
    const shuffled = [...bankQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, bankConfig.count);

    finalQuestions = selected.map((q) => ({
      id: q.id,
      bankId: q.id,
      subjectId: q.subjectId,
      subjectName: q.subject.name,
      type: q.type,
      text: q.text,
      imageUrl: q.imageUrl,
      options: q.options,
      correct: q.correct,
      correctMulti: q.correctMulti,
      correctText: q.correctText,
      matchMode: q.matchMode,
      correctNumber: q.correctNumber,
      tolerance: q.tolerance,
      correctBool: q.correctBool,
      explanation: q.explanation,
      points: q.points,
    }));

    // Основной предмет — первый выбранный
    if (!finalSubjectId) {
      finalSubjectId = picks[0].subjectId;
    }
  }

  if (!finalQuestions || finalQuestions.length === 0) {
    return NextResponse.json(
      { error: 'Добавь хотя бы 1 вопрос' },
      { status: 400 }
    );
  }

  const test = await prisma.test.create({
    data: {
      title,
      subjectId: finalSubjectId,
      teacherId: (session.user as any).id,
      mode,
      questions: finalQuestions,
      bankConfig: bankConfig || null,
      timeLimit: timeLimit || null,
      attemptsAllowed:
        typeof attemptsAllowed === 'number' ? attemptsAllowed : 1,
      topicId: topicId || null,
      published: Boolean(published),
    },
  });

  return NextResponse.json({ ok: true, id: test.id });
}