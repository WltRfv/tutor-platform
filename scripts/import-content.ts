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

/**
 * Разбивает файл на секции по маркерам === NAME ===.
 * Если одна и та же секция встречается несколько раз — склеивает их содержимое.
 */
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

  // TOPICS — плоский список глав
  const topicMap = new Map<string, string>();
  const topicsList = parseTopicsList(sections['TOPICS'] || '');
  for (let i = 0; i < topicsList.length; i++) {
    const title = topicsList[i];
    let topic = await prisma.topic.findFirst({
      where: { subjectId: subject.id, title },
    });
    if (topic) {
      await prisma.topic.update({
        where: { id: topic.id },
        data: { order: i },
      });
    } else {
      topic = await prisma.topic.create({
        data: { subjectId: subject.id, title, order: i, isActive: true },
      });
      report['Глав создано'] = (report['Глав создано'] || 0) + 1;
    }
    topicMap.set(title, topic.id);
  }

  async function ensureTopic(title: string): Promise<string | null> {
    if (!title) return null;
    const key = title.trim();
    if (topicMap.has(key)) return topicMap.get(key)!;
    let topic = await prisma.topic.findFirst({
      where: { subjectId: subject.id, title: key },
    });
    if (!topic) {
      topic = await prisma.topic.create({
        data: { subjectId: subject.id, title: key, order: 999 },
      });
      report['Глав создано'] = (report['Глав создано'] || 0) + 1;
    }
    topicMap.set(key, topic.id);
    return topic.id;
  }

  // NOTES — внутри главы, заголовок = параграф
  const notes = parseNotes(sections['NOTES'] || '');
  for (const n of notes) {
    const topicId = await ensureTopic(n.topicTitle);
    if (!topicId) {
      report['Конспектов пропущено'] =
        (report['Конспектов пропущено'] || 0) + 1;
      continue;
    }
    const existing = await prisma.note.findFirst({
      where: { subjectId: subject.id, title: n.title },
    });
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
    if (existing) await prisma.note.update({ where: { id: existing.id }, data });
    else await prisma.note.create({ data });
    report['Конспектов'] = (report['Конспектов'] || 0) + 1;
  }

  // QUESTIONS — банк заданий
  const questions = parseQuestionsBlock(sections['QUESTIONS'] || '');
  for (const q of questions) {
    const existing = await prisma.question.findFirst({
      where: { subjectId: subject.id, text: q.text },
    });
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
    if (existing)
      await prisma.question.update({ where: { id: existing.id }, data });
    else await prisma.question.create({ data });
    report['Заданий в банк'] = (report['Заданий в банк'] || 0) + 1;
  }

  // TESTS
  const tests = parseTests(sections['TESTS'] || '');
  for (const t of tests) {
    const topicId = await ensureTopic(t.topicTitle);
    const questionsJson = t.questions.map((q: RawQuestion, i: number) => ({
      id: `q${i + 1}`,
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

    const existing = await prisma.test.findFirst({
      where: { subjectId: subject.id, title: t.title },
    });
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
    if (existing) await prisma.test.update({ where: { id: existing.id }, data });
    else await prisma.test.create({ data });
    report['Тестов'] = (report['Тестов'] || 0) + 1;
  }

  // HOMEWORK
  const homeworks = parseHomeworks(sections['HOMEWORK'] || '');
  for (const h of homeworks) {
    const topicId = await ensureTopic(h.topicTitle);
    const existing = await prisma.homework.findFirst({
      where: { subjectId: subject.id, title: h.title },
    });
    let hwId: string;
    if (existing) {
      await prisma.homework.update({
        where: { id: existing.id },
        data: {
          description: h.description || null,
          dueDate: h.dueDate,
          targetType: h.targetType,
          topicId: topicId || null,
          topicName: h.topicTitle || null,
        },
      });
      hwId = existing.id;
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
        data: h.tasks.map((t, i) => ({
          homeworkId: hwId,
          order: i,
          text: t.text,
          answerType: 'TEXT',
          points: 1,
        })),
      });
    }
    report['ДЗ'] = (report['ДЗ'] || 0) + 1;
  }

  // LESSON PLANS
  const plans = parseLessonPlans(sections['LESSON_PLANS'] || '');
  for (const p of plans) {
    const topicId = await ensureTopic(p.topicTitle);
    const existing = await prisma.lessonPlan.findFirst({
      where: { subjectId: subject.id, title: p.title },
    });
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
    if (existing)
      await prisma.lessonPlan.update({ where: { id: existing.id }, data });
    else await prisma.lessonPlan.create({ data });
    report['Методичек'] = (report['Методичек'] || 0) + 1;
  }

  // PRESENTATIONS
  const presentations = parsePresentations(sections['PRESENTATIONS'] || '');
  for (const p of presentations) {
    const topicId = await ensureTopic(p.topicTitle);
    const existing = await prisma.presentation.findFirst({
      where: { subjectId: subject.id, title: p.title },
    });
    let pId: string;
    if (existing) {
      await prisma.presentation.update({
        where: { id: existing.id },
        data: {
          published: p.published,
          topicId: topicId || null,
          topicName: p.topicTitle || null,
        },
      });
      pId = existing.id;
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
        data: p.slides.map((s, i) => ({
          presentationId: pId,
          order: i,
          title: s.title || null,
          content: s.content,
        })),
      });
    }
    report['Презентаций'] = (report['Презентаций'] || 0) + 1;
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
        console.log(`   ${k}: ${v}`);
        globalReport[k] = (globalReport[k] || 0) + v;
      }
      console.log(`   ⏱ ${((Date.now() - t0) / 1000).toFixed(1)} сек\n`);
    } catch (e: any) {
      console.error(`   ❌ Ошибка: ${e.message}\n`);
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