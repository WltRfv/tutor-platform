import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadPublicImage } from '@/lib/supabase';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Файл больше 5 МБ' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'Можно загружать только изображения' },
      { status: 400 }
    );
  }

  try {
    const result = await uploadPublicImage((session.user as any).id, file);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[upload-image] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}