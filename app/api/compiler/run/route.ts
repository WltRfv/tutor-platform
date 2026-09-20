import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

const JUDGE0_URL =
  'https://ce.judge0.com/submissions?base64_encoded=true&wait=true';

const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  pascal: 67,
  javascript: 63,
  'c++': 54,
  java: 62,
};

function toBase64(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}

function fromBase64(str: string | null | undefined): string {
  if (!str) return '';
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Расчёт подозрения на ИИ (0-100)
function calcAiSuspicion(m: {
  totalChars: number;
  pastedChars: number;
  typedChars: number;
  typingDuration: number;
  pasteCount: number;
  avgTypingSpeed: number;
}): number {
  if (m.totalChars === 0) return 0;

  let suspicion = 0;
  const pasteRatio = m.pastedChars / m.totalChars;

  // Много вставлено
  if (pasteRatio > 0.9) suspicion += 60;
  else if (pasteRatio > 0.7) suspicion += 45;
  else if (pasteRatio > 0.5) suspicion += 30;
  else if (pasteRatio > 0.3) suspicion += 15;

  // Много отдельных вставок
  if (m.pasteCount >= 5) suspicion += 15;
  else if (m.pasteCount >= 3) suspicion += 10;

  // Слишком быстрая печать (>15 символов/сек — это ~180 WPM, почти невозможно)
  if (m.avgTypingSpeed > 20) suspicion += 30;
  else if (m.avgTypingSpeed > 15) suspicion += 20;
  else if (m.avgTypingSpeed > 10) suspicion += 10;

  // Много кода за короткое время
  if (m.totalChars > 500 && m.typingDuration < 60) suspicion += 20;
  else if (m.totalChars > 300 && m.typingDuration < 60) suspicion += 10;

  return Math.min(100, suspicion);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { language, code, metrics } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Пустой код' }, { status: 400 });
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return NextResponse.json(
      { error: 'Неподдерживаемый язык' },
      { status: 400 }
    );
  }

  let stdout = '';
  let stderr = '';
  let status = 'SUCCESS';

  try {
    const res = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: languageId,
        source_code: toBase64(code),
        stdin: toBase64(''),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Judge0 error: ${res.status} ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    stdout = fromBase64(data.stdout);
    const compileOutput = fromBase64(data.compile_output);
    const runtimeError = fromBase64(data.stderr);
    const statusId = data.status?.id;
    const statusDesc = data.status?.description || '';

    if (statusId === 3) {
      status = 'SUCCESS';
    } else if (statusId === 6) {
      status = 'ERROR';
      stderr = compileOutput || statusDesc || 'Ошибка компиляции';
    } else if (statusId >= 7 && statusId <= 12) {
      status = 'ERROR';
      stderr = runtimeError || statusDesc || 'Ошибка выполнения';
    } else if (statusId === 5) {
      status = 'ERROR';
      stderr = 'Превышено время выполнения';
    } else if (statusId === 4) {
      status = 'ERROR';
      stderr = statusDesc || 'Неверный ответ';
    } else if (statusId !== undefined && statusId > 6) {
      status = 'ERROR';
      stderr = runtimeError || compileOutput || statusDesc || 'Ошибка';
    }
  } catch (e: any) {
    status = 'FAILED';
    stderr = e.message;
  }

  // Метрики от клиента
  const m = {
    totalChars: metrics?.totalChars || code.length,
    pastedChars: metrics?.pastedChars || 0,
    typedChars: metrics?.typedChars || code.length,
    typingDuration: metrics?.typingDuration || 0,
    pasteCount: metrics?.pasteCount || 0,
    avgTypingSpeed: metrics?.avgTypingSpeed || 0,
  };

  const aiSuspicion = calcAiSuspicion(m);

  try {
    await prisma.codeRun.create({
      data: {
        userId: (session.user as any).id,
        language,
        code,
        output: stdout,
        stderr,
        status,
        totalChars: m.totalChars,
        pastedChars: m.pastedChars,
        typedChars: m.typedChars,
        typingDuration: m.typingDuration,
        pasteCount: m.pasteCount,
        avgTypingSpeed: m.avgTypingSpeed,
        aiSuspicion,
      },
    });
  } catch (dbErr) {
    console.error('DB log error:', dbErr);
  }

  // Telegram — при ошибке ИЛИ высоком подозрении
  try {
    if (aiSuspicion >= 60) {
      await sendTelegramNotification(
        `🚨 <b>Подозрение на ИИ-код</b>\n\n👤 ${session.user.name}\n💻 ${language}\n📊 Подозрение: <b>${aiSuspicion}%</b>\n📋 Вставлено: ${m.pastedChars} из ${m.totalChars} символов (${Math.round((m.pastedChars / m.totalChars) * 100)}%)\n⚡ Скорость: ${m.avgTypingSpeed} симв/сек\n🔢 Вставок: ${m.pasteCount}`
      );
    } else if (status === 'ERROR' || status === 'FAILED') {
      await sendTelegramNotification(
        `⚙️ <b>Запуск кода</b>\n\n👤 ${session.user.name}\n💻 ${language}\n❌ Статус: <b>${status}</b>\n\n<pre>${code.slice(0, 300)}</pre>`
      );
    }
  } catch {}

  return NextResponse.json({ run: { stdout, stderr } });
}