import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadHomeworkFile } from '@/lib/supabase';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Файл больше 10 МБ' }, { status: 400 });
  }

  try {
    const result = await uploadHomeworkFile((session.user as any).id, file);
    return NextResponse.json({ ok: true, file: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}