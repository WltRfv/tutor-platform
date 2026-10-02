import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type ParsedQuestion = {
  class?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: number;
  type: string;
  points?: number;
  text: string;
  options?: string[];
  correct?: number;
  correctMulti?: number[];
  correctText?: string;
  matchMode?: 'CONTAINS' | 'EXACT';
  correctNumber?: number;
  tolerance?: number;
  correctBool?: boolean;
  imageUrl?: string;
  explanation?: string;
};

const SUBJECT_MAP: Record<string, string> = {
  'математика 5': 'MATH_5',
  'математика 6': 'MATH_6',
  'алгебра 7': 'ALGEBRA_7',
  'алгебра 8': 'ALGEBRA_8',
  'алгебра 9': 'ALGEBRA_9',
  'геометрия 7': 'GEOMETRY_7',
  'геометрия 8': 'GEOMETRY_8',
  'геометрия 9': 'GEOMETRY_9',
  'информатика 7': 'INFORMATICS_7',
  'информатика 8': 'INFORMATICS_8',
  'информатика 9': 'INFORMATICS_9',
  'впр 5': 'VPR_5',
  'впр 6': 'VPR_6',
  'впр 7': 'VPR_7',
  'впр 8': 'VPR_8',
  'впр 9': 'VPR_9',
  'огэ 9': 'OGE_9',
  'огэ': 'OGE_9',
};

/**
 * Разбивает входной текст на блоки-вопросы.
 * Пробует по очереди:
 * 1. ━━━ ВОПРОС ━━━
 * 2. "Вопрос N:", "Задача N.", "№ N"
 * 3. "N)" или "N." в начале строки (минимум 2 блока)
 * 4. Весь текст как один вопрос
 */
function splitQuestions(text: string): string[] {
  const explicit = text.split(/━+\s*ВОПРОС\s*━+/i);
  if (explicit.length > 1) return explicit.map((s) => s.trim()).filter(Boolean);

  const labeled = text.split(/\n(?=\s*(?:Вопрос|Задача|№|Task)\s*\d+[\s:.)]*)/i);
  if (labeled.length > 1) return labeled.map((s) => s.trim()).filter(Boolean);

  const numbered = text.split(/\n(?=\s*\d{1,3}[).]\s)/);
  if (numbered.length >= 2) return numbered.map((s) => s.trim()).filter(Boolean);

  return [text.trim()];
}

/** Убирает служебный префикс "Вопрос N:", "Задача N.", "N)" из блока */
function stripPrefix(block: string): string {
  return block
    .replace(/^\s*(?:Вопрос|Задача|№|Task)\s*\d+[\s:.)]*/i, '')
    .replace(/^\s*\d{1,3}[).]\s+/, '')
    .trim();
}

function parseBlock(block: string): ParsedQuestion | null {
  const lines = block.split('\n').map((l) => l.trim());
  const q: Partial<ParsedQuestion> = {
    type: 'SINGLE_CHOICE',
    difficulty: 2,
    points: 1,
    tolerance: 0.01,
    matchMode: 'CONTAINS',
  };

  const plainLines: string[] = [];
  const options: string[] = [];
  let correctLetters: string[] = [];
  let explanationLines: string[] = [];
  let inExplanation = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('Пояснение:')) {
      inExplanation = true;
      explanationLines.push(line.replace(/^Пояснение:\s*/, ''));
      continue;
    }
    if (inExplanation && !/^[А-Яа-яA-Za-zЁё\s]+:/.test(line)) {
      explanationLines.push(line);
      continue;
    }
    inExplanation = false;

    if (line.startsWith('Класс:')) q.class = line.replace(/^Класс:\s*/, '');
    else if (line.startsWith('Предмет:')) q.subject = line.replace(/^Предмет:\s*/, '').trim();
    else if (line.startsWith('Тема:')) q.topic = line.replace(/^Тема:\s*/, '').trim();
    else if (line.startsWith('Подтема:')) q.subtopic = line.replace(/^Подтема:\s*/, '').trim();
    else if (line.startsWith('Сложность:')) {
      const val = parseInt(line.replace(/^Сложность:\s*/, ''));
      if (val >= 1 && val <= 3) q.difficulty = val;
    } else if (line.startsWith('Тип:')) {
      const raw = line.replace(/^Тип:\s*/, '').trim().toUpperCase();
      if (['SINGLE_CHOICE', 'MULTI_CHOICE', 'TEXT', 'NUMBER', 'TRUE_FALSE'].includes(raw)) {
        q.type = raw;
      }
    } else if (line.startsWith('Баллов:')) {
      q.points = parseInt(line.replace(/^Баллов:\s*/, '')) || 1;
    } else if (line.startsWith('Текст:')) {
      plainLines.push(line.replace(/^Текст:\s*/, ''));
    } else if (/^[A-ЯA-Z]\)/.test(line)) {
      options.push(line.replace(/^[A-ЯA-Z]\)\s*/, ''));
    } else if (line.startsWith('Правильный:') || line.startsWith('Правильные:')) {
      correctLetters = line.replace(/^Правильн[ые]{0,2}:\s*/, '').trim().split(/[,\s]+/).filter(Boolean);
    } else if (line.startsWith('Правильный ответ:')) {
      const val = line.replace(/^Правильный ответ:\s*/, '').trim();
      const up = val.toUpperCase();
      if (up === 'ПРАВДА' || up === 'TRUE') q.correctBool = true;
      else if (up === 'ЛОЖЬ' || up === 'FALSE') q.correctBool = false;
      else q.correctText = val;
    } else if (line.startsWith('Правильное число:')) {
      const val = parseFloat(line.replace(/^Правильное число:\s*/, '').replace(',', '.'));
      if (!isNaN(val)) q.correctNumber = val;
    } else if (line.startsWith('Погрешность:')) {
      const val = parseFloat(line.replace(/^Погрешность:\s*/, '').replace(',', '.'));
      if (!isNaN(val)) q.tolerance = val;
    } else if (line.startsWith('Режим проверки:')) {
      const val = line.replace(/^Режим проверки:\s*/, '').trim().toUpperCase();
      if (val === 'EXACT' || val === 'CONTAINS') q.matchMode = val as any;
    } else if (line.startsWith('Картинка:')) {
      const val = line.replace(/^Картинка:\s*/, '').trim();
      if (val.startsWith('http')) q.imageUrl = val;
    } else {
      plainLines.push(line);
    }
  }

  if (explanationLines.length > 0) {
    q.explanation = explanationLines.join(' ').trim();
  }

  // Если явного "Текст:" не было — весь plain-текст это вопрос
  const questionText = plainLines.join('\n').trim();
  if (!questionText) return null;

  // Автодетект типа, если не задан явно
  if (!q.type || q.type === 'SINGLE_CHOICE') {
    if (options.length > 0 && correctLetters.length > 1) q.type = 'MULTI_CHOICE';
    else if (options.length > 0) q.type = 'SINGLE_CHOICE';
    else if (q.correctBool !== undefined) q.type = 'TRUE_FALSE';
    else if (q.correctNumber !== undefined) q.type = 'NUMBER';
    else if (q.correctText) q.type = 'TEXT';
  }

  q.text = questionText;

  if ((q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') && options.length > 0) {
    q.options = options;
    if (q.type === 'SINGLE_CHOICE') {
      const letter = correctLetters[0]?.toUpperCase();
      q.correct = letter ? letter.charCodeAt(0) - 65 : 0;
    } else {
      q.correctMulti = correctLetters.map((l) => l.toUpperCase().charCodeAt(0) - 65);
    }
  }

  return q as ParsedQuestion;
}

function parseDoc(text: string): ParsedQuestion[] {
  const blocks = splitQuestions(text);
  const result: ParsedQuestion[] = [];
  for (const raw of blocks) {
    const cleaned = stripPrefix(raw);
    if (!cleaned) continue;
    const q = parseBlock(cleaned);
    if (q) result.push(q);
  }
  return result;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { text, dryRun } = await req.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Пустой текст' }, { status: 400 });
  }

  const parsed = parseDoc(text);

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: 'Не найдено ни одного вопроса. Проверь формат текста.' },
      { status: 400 }
    );
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, questions: parsed, total: parsed.length });
  }

  const subjects = await prisma.subjects.findMany({
    select: { id: true, code: true, name: true },
  });
  const subjectByCode = new Map(subjects.map((s) => [s.code, s]));

  const results: { ok: boolean; index: number; error?: string }[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < parsed.length; i++) {
    const q = parsed[i];
    try {
      let subjectId: string | null = null;

      if (q.subject) {
        const key = q.subject.toLowerCase().trim();
        const code = SUBJECT_MAP[key];
        if (code && subjectByCode.has(code)) subjectId = subjectByCode.get(code)!.id;
      }
      if (!subjectId && q.class === '5') subjectId = subjectByCode.get('MATH_5')?.id || null;
      if (!subjectId && q.class === '6') subjectId = subjectByCode.get('MATH_6')?.id || null;

      if (!subjectId) {
        results.push({ ok: false, index: i, error: `Не найден предмет: ${q.subject || '-'}` });
        skipped++;
        continue;
      }

      const existing = await prisma.question.findFirst({ where: { subjectId, text: q.text } });
      if (existing) {
        results.push({ ok: false, index: i, error: 'Дубликат по тексту' });
        skipped++;
        continue;
      }

      await prisma.question.create({
        data: {
          subjectId,
          topic: q.topic || 'Без темы',
          difficulty: q.difficulty || 2,
          type: q.type,
          text: q.text,
          imageUrl: q.imageUrl || null,
          options: q.options || undefined,
          correct: q.type === 'SINGLE_CHOICE' ? q.correct ?? 0 : undefined,
          correctMulti: q.type === 'MULTI_CHOICE' ? q.correctMulti : undefined,
          correctText: q.type === 'TEXT' ? q.correctText : null,
          matchMode: q.type === 'TEXT' ? q.matchMode || 'CONTAINS' : null,
          correctNumber: q.type === 'NUMBER' ? q.correctNumber : null,
          tolerance: q.type === 'NUMBER' ? q.tolerance ?? 0.01 : null,
          correctBool: q.type === 'TRUE_FALSE' ? q.correctBool : null,
          explanation: q.explanation || null,
          points: q.points || 1,
          source: 'import',
          authorId: (session.user as any).id,
        },
      });

      results.push({ ok: true, index: i });
      imported++;
    } catch (e: any) {
      results.push({ ok: false, index: i, error: e.message });
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    imported,
    skipped,
    total: parsed.length,
    results,
  });
}