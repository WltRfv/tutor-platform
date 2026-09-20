import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId') || undefined;
  const topic = searchParams.get('topic') || undefined;
  const difficulty = searchParams.get('difficulty');
  const type = searchParams.get('type') || undefined;
  const search = searchParams.get('search') || undefined;

  const where: any = { isActive: true };
  if (subjectId) where.subjectId = subjectId;
  if (topic) where.topic = topic;
  if (type) where.type = type;
  if (difficulty) where.difficulty = Number(difficulty);
  if (search) {
    where.OR = [
      { text: { contains: search, mode: 'insensitive' } },
      { topic: { contains: search, mode: 'insensitive' } },
    ];
  }

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { id: true, name: true } } },
    take: 200,
  });

  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const body = await req.json();
  const {
    subjectId,
    topic,
    difficulty,
    type,
    text,
    imageUrl,
    options,
    correct,
    correctMulti,
    correctText,
    matchMode,
    correctNumber,
    tolerance,
    correctBool,
    explanation,
    points,
    source,
  } = body;

  if (!subjectId || !text?.trim() || !topic?.trim()) {
    return NextResponse.json(
      { error: 'Заполни предмет, тему и текст' },
      { status: 400 }
    );
  }

  // Валидация по типу
  if (type === 'SINGLE_CHOICE') {
    if (!options || options.length < 2)
      return NextResponse.json({ error: 'Минимум 2 варианта' }, { status: 400 });
    if (options.some((o: string) => !o.trim()))
      return NextResponse.json({ error: 'Пустые варианты' }, { status: 400 });
    if (typeof correct !== 'number' || correct < 0 || correct >= options.length)
      return NextResponse.json({ error: 'Выбери правильный вариант' }, { status: 400 });
  }

  if (type === 'MULTI_CHOICE') {
    if (!options || options.length < 2)
      return NextResponse.json({ error: 'Минимум 2 варианта' }, { status: 400 });
    if (!Array.isArray(correctMulti) || correctMulti.length === 0)
      return NextResponse.json({ error: 'Отметь правильные' }, { status: 400 });
  }

  if (type === 'TEXT' && !correctText?.trim())
    return NextResponse.json({ error: 'Укажи правильный ответ' }, { status: 400 });

  if (type === 'NUMBER' && (correctNumber === null || isNaN(Number(correctNumber))))
    return NextResponse.json({ error: 'Укажи число' }, { status: 400 });

  if (type === 'TRUE_FALSE' && typeof correctBool !== 'boolean')
    return NextResponse.json({ error: 'Выбери Правда/Ложь' }, { status: 400 });

  const question = await prisma.question.create({
    data: {
      subjectId,
      topic: topic.trim(),
      difficulty: difficulty || 2,
      type,
      text: text.trim(),
      imageUrl: imageUrl || null,
      options: options || null,
      correct: typeof correct === 'number' ? correct : null,
      correctMulti: correctMulti || null,
      correctText: correctText || null,
      matchMode: matchMode || 'CONTAINS',
      correctNumber:
        correctNumber !== undefined && correctNumber !== null
          ? Number(correctNumber)
          : null,
      tolerance: tolerance !== undefined ? Number(tolerance) : 0.01,
      correctBool: typeof correctBool === 'boolean' ? correctBool : null,
      explanation: explanation || null,
      points: points || 1,
      source: source || 'manual',
      authorId: (session.user as any).id,
    },
  });

  return NextResponse.json({ ok: true, question });
}