import { NextResponse } from 'next/server';
import { auth } from '@/auth';

function splitTasks(text: string): string[] {
  // 1. Явные метки
  let parts = text.split(/\n(?=\s*(?:Задача|Задание|№|Task)\s*\d+[\s:.)]*)/i);
  if (parts.length > 1) return parts.map((s) => s.trim()).filter(Boolean);

  // 2. Просто номер "N)" или "N."
  parts = text.split(/\n(?=\s*\d{1,3}[).]\s)/);
  if (parts.length >= 2) return parts.map((s) => s.trim()).filter(Boolean);

  // 3. Пустые строки
  parts = text.split(/\n\s*\n+/);
  if (parts.length >= 2) return parts.map((s) => s.trim()).filter(Boolean);

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
  const tasks = rawBlocks
    .map(stripPrefix)
    .filter(Boolean)
    .map((t) => ({ text: t }));

  return NextResponse.json({ ok: true, tasks, total: tasks.length });
}