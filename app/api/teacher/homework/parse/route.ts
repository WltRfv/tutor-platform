import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Разбивает текст на задачи.
 * Комбинированный паттерн — разделяет за один проход по всем меткам:
 *   "Задача N.", "Задание N.", "№ N", "Task N"
 *   "N)" или "N." в начале строки
 */
function splitTasks(text: string): string[] {
  const union =
    /\n(?=\s*(?:(?:Задача|Задание|№|Task)\s*\d+[\s:.)]*|\d{1,3}[).]\s))/i;
  const parts = text.split(union).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts;

  // fallback: пустые строки
  const byBlanks = text.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
  if (byBlanks.length >= 2) return byBlanks;

  return [text.trim()];
}

function stripPrefix(block: string): string {
  return block
    .replace(/^\s*(?:Задача|Задание|№|Task)\s*\d+[\s:.)]*/i, '')
    .replace(/^\s*\d{1,3}[).]\s+/, '')
    .trim();
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const text = (body.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Пустой текст' }, { status: 400 });

  const rawBlocks = splitTasks(text);
  const tasks = rawBlocks.map(stripPrefix).filter(Boolean).map((t) => ({ text: t }));

  return NextResponse.json({ ok: true, tasks, total: tasks.length });
}