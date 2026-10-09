import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

// Загружаем переменные окружения
config({ path: '.env.local' });
config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Не найден DATABASE_URL. Проверь .env.local');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const CONTENT_DIR = path.resolve(process.cwd(), 'content');
const ARGS = process.argv.slice(2);
const ONLY_FILE = ARGS.find((a) => a.endsWith('.md'));

// ─────────────────────────────── Утилиты ───────────────────────────────

function cleanText(s: string): string {
  return s
    .replace(/^```(?:text|markdown|md)?\s*\n/, '')
    .replace(/\n```\s*$/, '')
    .trim();
}

function splitSections(text: string): Record<string, string> {
  const buckets: Record<string, string[]> = {};
  const re = /^===\s*([A-Z_]+)\s*===\s*$/gm;
  const matches: { name: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push({
      name: m[1].toUpperCase(),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end;
    const end = i + 1 < matches.length ? matches[i + 1].start : text.length;
    const content = cleanText(text.slice(start, end));
    if (!buckets[matches[i].name]) buckets[matches[i].name] = [];
    buckets[matches[i].name].push(content);
  }
  const merged: Record<string, string> = {};
  for (const [name, parts] of Object.entries(buckets)) {
    merged[name] = parts.filter(Boolean).join('\n\n');
  }
  return merged;
}

function parseKV(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([А-Яа-яA-Za-z ]+):\s*(.*)$/);
    if (m) out[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return out;
}

function logProgress(label: string, current: number, total: number) {
  const width = 30;
  const filled = Math.round((current / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  process.stdout.write(`   ${label}: [${bar}] ${current}/${total}\r`);
}

function logDone(label: string, total: number, elapsedMs?: number) {
  const time = elapsedMs ? ` (${(elapsedMs / 1000).toFixed(1)}с)` : '';
  process.stdout.write(`   ${label}: ${total}${time}                    \n`);
}

// ───────────────────────────── SUBJECT + TOPICS ─────────────────────────────

function parseTopicsList(block: string): string[] {
  const out: string[] = [];
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^[-*]?\s*(.+)$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

// ─────────────────────────────── NOTES ───────────────────────────────

function parseNotes(block: string) {
  const out: any[] = [];
  const re = /---\s*NOTE\s*---([\s\S]*?)---\s*END\s*NOTE\s*---/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const raw = cleanText(m[1]);
    const headEnd = raw.search(/^####\s/m);
    const head = headEnd >= 0 ? raw.slice(0, headEnd) : raw;
    const body = headEnd >= 0 ? raw.slice(headEnd) : '';
    const meta = parseKV(head);

    const grab = (name: string) => {
      const headingRe = new RegExp(`^####\\s*${name}\\s*$`, 'm');
      const hm = body.match(headingRe);
      if (!hm || hm.index === undefined) return '';
      const rest = body.slice(hm.index + hm[0].length);
      const next = rest.match(/^####\s/m);
      const content =
        next && next.index !== undefined ? rest.slice(0, next.index) : rest;
      return content.trim();
    };

    out.push({
      topicTitle: meta['тема'] || '',
      title: meta['заголовок'] || meta['тема'] || '',
      published: (meta['опубликован'] || '').toLowerCase() === 'да',
      theory: grab('ТЕОРИЯ'),
      practice: grab('ПРАКТИКА'),
      selfwork: grab('САМОСТОЯТЕЛЬНАЯ'),
    });
  }
  return out;
}

// ─────────────────────────────── ВОПРОСЫ ───────────────────────────────

type RawQuestion = {
  topicTitle: string;
  difficulty: number;
  type: string;
  text: string;
  options: string[];
  correct?: number;
  correctMulti?: number[];
  correctNumber?: number;
  correctBool?: boolean;
  correctText?: string;
  tolerance: number;
  points: number;
  explanation?: string;
};

function parseSingleQuestion(raw: string): RawQuestion | null {
  const q: RawQuestion = {
    topicTitle: '',
    difficulty: 2,
    type: 'SINGLE_CHOICE',
    text: '',
    options: [],
    tolerance: 0.01,
    points: 1,
  };

  let textMode = false;
  const textParts: string[] = [];
  let correctRaw = '';

  for (const line of raw.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const kv = line.match(/^([А-Яа-яA-Za-z ]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim().toLowerCase();
      const val = kv[2].trim();
      if (key === 'тема') {
        q.topicTitle = val;
        textMode = false;
      } else if (key === 'сложность') {
        q.difficulty = parseInt(val) || 2;
        textMode = false;
      } else if (key === 'тип') {
        q.type = val.toUpperCase();
        textMode = false;
      } else if (key === 'баллов') {
        q.points = parseInt(val) || 1;
        textMode = false;
      } else if (key === 'текст') {
        q.text = val;
        textMode = true;
      } else if (key === 'правильный' || key === 'правильные') {
        correctRaw = val;
        textMode = false;
      } else if (key === 'правильное число') {
        q.correctNumber = parseFloat(val.replace(',', '.'));
        textMode = false;
      } else if (key === 'правильный ответ') {
        const up = val.toUpperCase();
        if (up === 'ВЕРНО' || up === 'ПРАВДА' || up === 'TRUE') q.correctBool = true;
        else if (up === 'НЕВЕРНО' || up === 'ЛОЖЬ' || up === 'FALSE') q.correctBool = false;
        else q.correctText = val;
        textMode = false;
      } else if (key === 'погрешность') {
        q.tolerance = parseFloat(val.replace(',', '.')) || 0.01;
        textMode = false;
      } else if (key === 'пояснение') {
        q.explanation = val;
        textMode = false;
      }
    } else if (/^[A-DА-Я]\)/.test(line)) {
      q.options.push(line.replace(/^[A-DА-Я]\)\s*/, ''));
      textMode = false;
    } else if (textMode) {
      textParts.push(line);
    }
  }

  if (textParts.length) q.text += (q.text ? ' ' : '') + textParts.join(' ');
  if (!q.text.trim()) return null;

  const type = q.type || 'SINGLE_CHOICE';

  if (type === 'SINGLE_CHOICE') {
    const letter = (correctRaw || 'A').toUpperCase().replace(/[^A-DА-Я]/g, '');
    const idx = 'ABCD'.indexOf(letter) >= 0 ? 'ABCD'.indexOf(letter) : 0;
    q.correct = idx;
  } else if (type === 'MULTI_CHOICE') {
    const letters = (correctRaw || '')
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    q.correctMulti = letters
      .map((l) => 'ABCD'.indexOf(l))
      .filter((i) => i >= 0);
    if (q.correctMulti.length === 0) q.correctMulti = [0];
  } else if (type === 'NUMBER') {
    if (q.correctNumber === undefined) {
      const n = parseFloat((correctRaw || '').replace(',', '.'));
      if (!isNaN(n)) q.correctNumber = n;
    }
    if (q.correctNumber === undefined) return null;
  } else if (type === 'TRUE_FALSE') {
    if (typeof q.correctBool !== 'boolean') {
      const raw = (correctRaw || '').toUpperCase().replace(/[^А-ЯA-Z]/g, '');
      if (
        raw === 'A' ||
        raw === 'ВЕРНО' ||
        raw === 'ПРАВДА' ||
        raw === 'TRUE' ||
        raw === 'ДА'
      ) {
        q.correctBool = true;
      } else if (
        raw === 'B' ||
        raw === 'НЕВЕРНО' ||
        raw === 'ЛОЖЬ' ||
        raw === 'FALSE' ||
        raw === 'НЕТ'
      ) {
        q.correctBool = false;
      }
    }
    if (typeof q.correctBool !== 'boolean') return null;
  } else if (type === 'TEXT') {
    if (!q.correctText) q.correctText = correctRaw;
    if (!q.correctText) return null;
  }

  return q;
}

function parseQuestionsBlock(block: string): RawQuestion[] {
  const parts = block
    .split(/━+\s*ВОПРОС\s*━+/i)
    .map((s) => cleanText(s))
    .filter(Boolean);
  const out: RawQuestion[] = [];
  for (const p of parts) {
    const q = parseSingleQuestion(p);
    if (q) out.push(q);
  }
  return out;
}

// ─────────────────────────────── TESTS ───────────────────────────────

function parseTests(block: string) {
  const out: any[] = [];
  const re = /---\s*TEST\s*---([\s\S]*?)---\s*END\s*TEST\s*---/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const raw = cleanText(m[1]);
    const qStart = raw.search(/---\s*ВОПРОС\s*---/);
    const head = qStart >= 0 ? raw.slice(0, qStart) : raw;
    const qBlock = qStart >= 0 ? raw.slice(qStart) : '';
    const meta = parseKV(head);

    const questions: RawQuestion[] = [];
    const qRe = /---\s*ВОПРОС\s*---([\s\S]*?)(?=---\s*ВОПРОС\s*---|$)/g;
    let qm: RegExpExecArray | null;
    while ((qm = qRe.exec(qBlock)) !== null) {
      const q = parseSingleQuestion(qm[1].trim());
      if (q) questions.push(q);
    }

    out.push({
      topicTitle: meta['тема'] || '',
      title: meta['название'] || '',
      timeLimit: parseInt(meta['время'] || '15'),
      attemptsAllowed: parseInt(meta['попыток'] || '1'),
      published: (meta['опубликован'] || '').toLowerCase() === 'да',
      questions,
    });
  }
  return out;
}

// ─────────────────────────────── HOMEWORK ───────────────────────────────

function parseTasks(text: string): { text: string }[] {
  const union =
    /\n(?=\s*(?:Задача|Задание|№|Task)\s*\d+[\s:.)]*|\d{1,3}[).]\s)/i;
  let parts = text.split(union).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) {
    parts = text.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
  }
  return parts
    .map((p) => ({
      text: p
        .replace(/^\s*(?:Задача|Задание|№|Task)\s*\d+[\s:.)]*/i, '')
        .replace(/^\s*\d{1,3}[).]\s+/, '')
        .trim(),
    }))
    .filter((t) => t.text);
}

function parseHomeworks(block: string) {
  const out: any[] = [];
  const re = /---\s*HOMEWORK\s*---([\s\S]*?)---\s*END\s*HOMEWORK\s*---/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const raw = cleanText(m[1]);
    const lines = raw.split('\n');
    const metaLines: string[] = [];
    const bodyLines: string[] = [];
    let inMeta = true;
    for (const line of lines) {
      if (inMeta) {
        if (/^[А-Яа-яA-Za-z ]+:\s*.+$/.test(line) || line.trim() === '') {
          metaLines.push(line);
        } else {
          inMeta = false;
          bodyLines.push(line);
        }
      } else bodyLines.push(line);
    }
    const meta = parseKV(metaLines.join('\n'));
    out.push({
      topicTitle: meta['тема'] || '',
      title: meta['заголовок'] || '',
      targetType:
        (meta['кому'] || '').toLowerCase() === 'всем' ? 'ALL' : 'SPECIFIC',
      dueDate: meta['срок'] ? new Date(meta['срок']) : null,
      description: meta['общее описание'] || '',
      tasks: parseTasks(bodyLines.join('\n')),
    });
  }
  return out;
}

// ────────────────────────────── LESSON PLANS ──────────────────────────────

function parseLessonPlans(block: string) {
  const out: any[] = [];
  const re =
    /---\s*LESSON_PLAN\s*---([\s\S]*?)---\s*END\s*LESSON_PLAN\s*---/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const raw = cleanText(m[1]);
    const headEnd = raw.search(/^#\s/m);
    const head = headEnd >= 0 ? raw.slice(0, headEnd) : raw;
    const body = headEnd >= 0 ? raw.slice(headEnd) : '';
    const meta = parseKV(head);
    out.push({
      topicTitle: meta['тема'] || '',
      title: meta['заголовок'] || '',
      duration: parseInt(meta['длительность'] || '45'),
      published: (meta['опубликован'] || '').toLowerCase() === 'да',
      content: body.trim(),
    });
  }
  return out;
}

// ────────────────────────────── PRESENTATIONS ──────────────────────────────

function parsePresentations(block: string) {
  const out: any[] = [];
  const re =
    /---\s*PRESENTATION\s*---([\s\S]*?)---\s*END\s*PRESENTATION\s*---/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const raw = cleanText(m[1]);
    const slideStart = raw.search(/---\s*СЛАЙД\s*\d+\s*---/);
    const head = slideStart >= 0 ? raw.slice(0, slideStart) : raw;
    const slidesBlock = slideStart >= 0 ? raw.slice(slideStart) : '';
    const meta = parseKV(head);

    const slides: { title: string; content: string }[] = [];
    const sRe =
      /---\s*СЛАЙД\s*\d+\s*---([\s\S]*?)(?=---\s*СЛАЙД\s*\d+\s*---|$)/g;
    let sm: RegExpExecArray | null;
    while ((sm = sRe.exec(slidesBlock)) !== null) {
      const body = cleanText(sm[1]);
      const headEnd = body.indexOf('\n---');
      const sHead = headEnd >= 0 ? body.slice(0, headEnd) : body;
      const sBody = headEnd >= 0 ? body.slice(headEnd + 4).trim() : '';
      const sMeta = parseKV(sHead);
      slides.push({
        title: sMeta['заголовок'] || '',
        content: sBody,
      });
    }

    out.push({
      topicTitle: meta['тема'] || '',
      title: meta['заголовок'] || '',
      published: (meta['опубликован'] || '').toLowerCase() === 'да',
      slides,
    });
  }
  return out;
}

// ─────────────────────────────── ИМПОРТ ───────────────────────────────

type Report = Record<string, number>;

async function importSubject(
  sections: Record<string, string>,
  report: Report
) {
  const subjectBlock = sections['SUBJECT'];
  if (!subjectBlock) throw new Error('Нет секции === SUBJECT ===');
  const meta = parseKV(subjectBlock);
  const code = meta['код'];
  if (!code) throw new Error('Не указан Код в SUBJECT');

  const subject = await prisma.subjects.upsert({
    where: { code },
    create: {
      code,
      name: meta['название'] || code,
      category: meta['категория'] || 'other',
      grade: meta['класс'] ? parseInt(meta['класс']) : null,
      color: meta['цвет'] || 'purple',
    },
    update: {
      name: meta['название'] || code,
      category: meta['категория'] || 'other',
      grade: meta['класс'] ? parseInt(meta['класс']) : null,
      color: meta['цвет'] || 'purple',
    },
  });

  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!teacher) throw new Error('Не найден TEACHER в БД');
  const teacherId = teacher.id;

  // ─── Разбираем ВСЁ заранее ───
  console.log('   📄 Парсинг файла...');
  const notesPre = parseNotes(sections['NOTES'] || '');
  const testsPre = parseTests(sections['TESTS'] || '');
  const homeworksPre = parseHomeworks(sections['HOMEWORK'] || '');
  const plansPre = parseLessonPlans(sections['LESSON_PLANS'] || '');
  const presentationsPre = parsePresentations(sections['PRESENTATIONS'] || '');
  const questionsPre = parseQuestionsBlock(sections['QUESTIONS'] || '');
  console.log(
    `   Найдено: конспектов ${notesPre.length}, заданий ${questionsPre.length}, тестов ${testsPre.length}, ДЗ ${homeworksPre.length}, методичек ${plansPre.length}, презентаций ${presentationsPre.length}`
  );

  // ─── TOPICS ───
  const topicMap = new Map<string, string>();
  const topicsList = parseTopicsList(sections['TOPICS'] || '');
  const allTopicTitles = new Set<string>(topicsList);
  notesPre.forEach((n) => n.topicTitle && allTopicTitles.add(n.topicTitle));
  testsPre.forEach((t) => t.topicTitle && allTopicTitles.add(t.topicTitle));
  homeworksPre.forEach((h) => h.topicTitle && allTopicTitles.add(h.topicTitle));
  plansPre.forEach((p) => p.topicTitle && allTopicTitles.add(p.topicTitle));
  presentationsPre.forEach(
    (p) => p.topicTitle && allTopicTitles.add(p.topicTitle)
  );

  // Один запрос — все существующие темы
  const existingTopics = await prisma.topic.findMany({
    where: { subjectId: subject.id },
    select: { id: true, title: true },
  });
  const existingTopicMap = new Map(existingTopics.map((t) => [t.title, t.id]));

  console.log(`   🗂 Создаю/обновляю ${allTopicTitles.size} тем...`);
  let orderCounter = 0;
  for (const title of allTopicTitles) {
    const existingId = existingTopicMap.get(title);
    if (existingId) {
      await prisma.topic.update({
        where: { id: existingId },
        data: { order: orderCounter++ },
      });
      topicMap.set(title, existingId);
    } else {
      const created = await prisma.topic.create({
        data: { subjectId: subject.id, title, order: orderCounter++, isActive: true },
      });
      topicMap.set(title, created.id);
      report['Глав создано'] = (report['Глав создано'] || 0) + 1;
    }
  }

  function ensureTopic(title: string): string | null {
    if (!title) return null;
    return topicMap.get(title.trim()) || null;
  }

  // ─── NOTES ───
  if (notesPre.length > 0) {
    const t0 = Date.now();
    const existingNotes = await prisma.note.findMany({
      where: { subjectId: subject.id },
      select: { id: true, title: true },
    });
    const existingNoteMap = new Map(existingNotes.map((n) => [n.title, n.id]));

    for (let i = 0; i < notesPre.length; i++) {
      logProgress('📘 Конспекты', i + 1, notesPre.length);
      const n = notesPre[i];
      const topicId = ensureTopic(n.topicTitle);
      if (!topicId) {
        report['Конспектов пропущено'] =
          (report['Конспектов пропущено'] || 0) + 1;
        continue;
      }
      const data = {
        title: n.title,
        content: n.theory || ' ',
        practiceContent: n.practice || null,
        selfWorkContent: n.selfwork || null,
        subjectId: subject.id,
        topicId,
        topicName: n.topicTitle,
        published: n.published,
        authorId: teacherId,
      };
      const existingId = existingNoteMap.get(n.title);
      if (existingId) {
        await prisma.note.update({ where: { id: existingId }, data });
      } else {
        await prisma.note.create({ data });
      }
    }
    logDone('📘 Конспекты', notesPre.length, Date.now() - t0);
    report['Конспектов'] = (report['Конспектов'] || 0) + notesPre.length;
  }

  // ─── QUESTIONS ───
  if (questionsPre.length > 0) {
    const t0 = Date.now();
    console.log('   🧠 Загружаю существующие вопросы...');
    const existingQuestions = await prisma.question.findMany({
      where: { subjectId: subject.id },
      select: { id: true, text: true },
    });
    const existingQMap = new Map(
      existingQuestions.map((q) => [q.text, q.id])
    );
    console.log(`   Существующих: ${existingQuestions.length}`);

    const toCreateQ: any[] = [];
    const toUpdateQ: { id: string; data: any }[] = [];

    for (const q of questionsPre) {
      const data: any = {
        subjectId: subject.id,
        topic: q.topicTitle || 'Без темы',
        difficulty: q.difficulty,
        type: q.type,
        text: q.text,
        options: q.options.length ? q.options : undefined,
        correct: q.type === 'SINGLE_CHOICE' ? q.correct ?? 0 : undefined,
        correctMulti: q.type === 'MULTI_CHOICE' ? q.correctMulti : undefined,
        correctText: q.type === 'TEXT' ? q.correctText ?? null : null,
        matchMode: q.type === 'TEXT' ? 'CONTAINS' : null,
        correctNumber: q.type === 'NUMBER' ? q.correctNumber ?? null : null,
        tolerance: q.type === 'NUMBER' ? q.tolerance : null,
        correctBool: q.type === 'TRUE_FALSE' ? q.correctBool ?? null : null,
        explanation: q.explanation || null,
        points: q.points,
        source: 'import',
        authorId: teacherId,
      };
      const existingId = existingQMap.get(q.text);
      if (existingId) {
        toUpdateQ.push({ id: existingId, data });
      } else {
        toCreateQ.push(data);
      }
    }

    if (toCreateQ.length > 0) {
      console.log(`   📥 Вставляю ${toCreateQ.length} новых вопросов...`);
      // Разбиваем на чанки по 500 — если вдруг очень много
      const CHUNK = 500;
      for (let i = 0; i < toCreateQ.length; i += CHUNK) {
        const chunk = toCreateQ.slice(i, i + CHUNK);
        await prisma.question.createMany({ data: chunk });
        logProgress('📥 Вставка вопросов', Math.min(i + CHUNK, toCreateQ.length), toCreateQ.length);
      }
      process.stdout.write('\n');
    }

    if (toUpdateQ.length > 0) {
      console.log(`   ✏️ Обновляю ${toUpdateQ.length} существующих...`);
      for (let i = 0; i < toUpdateQ.length; i++) {
        logProgress('✏️ Обновление', i + 1, toUpdateQ.length);
        await prisma.question.update({
          where: { id: toUpdateQ[i].id },
          data: toUpdateQ[i].data,
        });
      }
      process.stdout.write('\n');
    }

    logDone('🧠 Вопросы', questionsPre.length, Date.now() - t0);
    report['Заданий в банк'] = questionsPre.length;
  }

  // ─── TESTS ───
  if (testsPre.length > 0) {
    const t0 = Date.now();
    const existingTests = await prisma.test.findMany({
      where: { subjectId: subject.id },
      select: { id: true, title: true },
    });
    const existingTestMap = new Map(existingTests.map((t) => [t.title, t.id]));

    for (let i = 0; i < testsPre.length; i++) {
      logProgress('📝 Тесты', i + 1, testsPre.length);
      const t = testsPre[i];
      const topicId = ensureTopic(t.topicTitle);
      const questionsJson = t.questions.map((q: RawQuestion, qi: number) => ({
        id: `q${qi + 1}`,
        type: q.type,
        text: q.text,
        points: q.points,
        ...(q.type === 'SINGLE_CHOICE' && {
          options: q.options,
          correct: q.correct,
        }),
        ...(q.type === 'MULTI_CHOICE' && {
          options: q.options,
          correctMulti: q.correctMulti,
        }),
        ...(q.type === 'TEXT' && {
          correctText: q.correctText,
          matchMode: 'CONTAINS',
        }),
        ...(q.type === 'NUMBER' && {
          correctNumber: q.correctNumber,
          tolerance: q.tolerance,
        }),
        ...(q.type === 'TRUE_FALSE' && { correctBool: q.correctBool }),
      }));

      const data = {
        title: t.title,
        subjectId: subject.id,
        teacherId,
        mode: 'MANUAL',
        questions: questionsJson,
        timeLimit: t.timeLimit,
        attemptsAllowed: t.attemptsAllowed,
        published: t.published,
        topicId: topicId || null,
      };

      const existingId = existingTestMap.get(t.title);
      if (existingId) {
        await prisma.test.update({ where: { id: existingId }, data });
      } else {
        await prisma.test.create({ data });
      }
    }
    logDone('📝 Тесты', testsPre.length, Date.now() - t0);
    report['Тестов'] = (report['Тестов'] || 0) + testsPre.length;
  }

  // ─── HOMEWORK ───
  if (homeworksPre.length > 0) {
    const t0 = Date.now();
    const existingHomeworks = await prisma.homework.findMany({
      where: { subjectId: subject.id },
      select: { id: true, title: true },
    });
    const existingHwMap = new Map(existingHomeworks.map((h) => [h.title, h.id]));

    for (let i = 0; i < homeworksPre.length; i++) {
      logProgress('📋 ДЗ', i + 1, homeworksPre.length);
      const h = homeworksPre[i];
      const topicId = ensureTopic(h.topicTitle);
      const existingId = existingHwMap.get(h.title);
      let hwId: string;
      if (existingId) {
        await prisma.homework.update({
          where: { id: existingId },
          data: {
            description: h.description || null,
            dueDate: h.dueDate,
            targetType: h.targetType,
            topicId: topicId || null,
            topicName: h.topicTitle || null,
          },
        });
        hwId = existingId;
        await prisma.homeworkTask.deleteMany({ where: { homeworkId: hwId } });
      } else {
        const created = await prisma.homework.create({
          data: {
            title: h.title,
            description: h.description || null,
            subjectId: subject.id,
            dueDate: h.dueDate,
            targetType: h.targetType,
            topicId: topicId || null,
            topicName: h.topicTitle || null,
            teacherId,
          },
        });
        hwId = created.id;
      }
      if (h.tasks.length) {
        await prisma.homeworkTask.createMany({
          data: h.tasks.map((t: { text: string }, ti: number) => ({
            homeworkId: hwId,
            order: ti,
            text: t.text,
            answerType: 'TEXT',
            points: 1,
          })),
        });
      }
    }
    logDone('📋 ДЗ', homeworksPre.length, Date.now() - t0);
    report['ДЗ'] = (report['ДЗ'] || 0) + homeworksPre.length;
  }

  // ─── LESSON PLANS ───
  if (plansPre.length > 0) {
    const t0 = Date.now();
    const existingPlans = await prisma.lessonPlan.findMany({
      where: { subjectId: subject.id },
      select: { id: true, title: true },
    });
    const existingPlanMap = new Map(existingPlans.map((p) => [p.title, p.id]));

    for (let i = 0; i < plansPre.length; i++) {
      logProgress('📖 Методички', i + 1, plansPre.length);
      const p = plansPre[i];
      const topicId = ensureTopic(p.topicTitle);
      const data = {
        title: p.title,
        subjectId: subject.id,
        content: p.content,
        duration: p.duration,
        published: p.published,
        topicId: topicId || null,
        topicName: p.topicTitle || null,
        authorId: teacherId,
      };
      const existingId = existingPlanMap.get(p.title);
      if (existingId) {
        await prisma.lessonPlan.update({ where: { id: existingId }, data });
      } else {
        await prisma.lessonPlan.create({ data });
      }
    }
    logDone('📖 Методички', plansPre.length, Date.now() - t0);
    report['Методичек'] = (report['Методичек'] || 0) + plansPre.length;
  }

  // ─── PRESENTATIONS ───
  if (presentationsPre.length > 0) {
    const t0 = Date.now();
    const existingPres = await prisma.presentation.findMany({
      where: { subjectId: subject.id },
      select: { id: true, title: true },
    });
    const existingPresMap = new Map(existingPres.map((p) => [p.title, p.id]));

    for (let i = 0; i < presentationsPre.length; i++) {
      logProgress('🎞 Презентации', i + 1, presentationsPre.length);
      const p = presentationsPre[i];
      const topicId = ensureTopic(p.topicTitle);
      let pId: string;
      const existingId = existingPresMap.get(p.title);
      if (existingId) {
        await prisma.presentation.update({
          where: { id: existingId },
          data: {
            published: p.published,
            topicId: topicId || null,
            topicName: p.topicTitle || null,
          },
        });
        pId = existingId;
        await prisma.slide.deleteMany({ where: { presentationId: pId } });
      } else {
        const created = await prisma.presentation.create({
          data: {
            title: p.title,
            subjectId: subject.id,
            published: p.published,
            topicId: topicId || null,
            topicName: p.topicTitle || null,
            authorId: teacherId,
          },
        });
        pId = created.id;
      }
      if (p.slides.length) {
        await prisma.slide.createMany({
          data: p.slides.map(
            (s: { title: string; content: string }, si: number) => ({
              presentationId: pId,
              order: si,
              title: s.title || null,
              content: s.content,
            })
          ),
        });
      }
    }
    logDone('🎞 Презентации', presentationsPre.length, Date.now() - t0);
    report['Презентаций'] = (report['Презентаций'] || 0) + presentationsPre.length;
  }
}

// ─────────────────────────────── MAIN ───────────────────────────────

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ Папка ${CONTENT_DIR} не найдена`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const toProcess = ONLY_FILE ? files.filter((f) => f === ONLY_FILE) : files;

  if (toProcess.length === 0) {
    console.error('❌ Нет файлов для импорта');
    process.exit(1);
  }

  console.log(`📦 Файлов: ${toProcess.length}\n`);
  const globalReport: Report = {};

  for (const file of toProcess) {
    const t0 = Date.now();
    const filePath = path.join(CONTENT_DIR, file);
    const text = fs.readFileSync(filePath, 'utf-8');
    const sections = splitSections(text);

    console.log(`📥 ${file}`);
    const report: Report = {};
    try {
      await importSubject(sections, report);
      for (const [k, v] of Object.entries(report)) {
        console.log(`   ✓ ${k}: ${v}`);
        globalReport[k] = (globalReport[k] || 0) + v;
      }
      console.log(`   ⏱ Итого: ${((Date.now() - t0) / 1000).toFixed(1)} сек\n`);
    } catch (e: any) {
      console.error(`   ❌ Ошибка: ${e.message}\n`);
      if (e.stack) console.error(e.stack);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ИТОГО:');
  for (const [k, v] of Object.entries(globalReport)) {
    console.log(`   ${k}: ${v}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());