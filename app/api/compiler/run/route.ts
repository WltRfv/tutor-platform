import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { language, version, code } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Пустой код' }, { status: 400 });
  }

  let result: any = {};
  let status = 'SUCCESS';

  try {
    const res = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        files: [{ content: code }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Piston error: ${res.status} ${errText.slice(0, 200)}`);
    }

    result = await res.json();
    if (result.run?.stderr) status = 'ERROR';
  } catch (e: any) {
    status = 'FAILED';
    result = { run: { stderr: e.message, stdout: '' } };
  }

  try {
    await prisma.codeRun.create({
      data: {
        userId: (session.user as any).id,
        language,
        code,
        output: result.run?.stdout || '',
        stderr: result.run?.stderr || '',
        status,
      },
    });
  } catch (dbErr) {
    console.error('DB log error:', dbErr);
  }

  if (status === 'ERROR' || status === 'FAILED') {
    try {
      await sendTelegramNotification(
        `⚙️ <b>Запуск кода</b>\n\n👤 ${session.user.name}\n💻 ${language}\n❌ Статус: <b>${status}</b>\n\n<pre>${code.slice(0, 300)}</pre>`
      );
    } catch {}
  }

  return NextResponse.json(result);
}