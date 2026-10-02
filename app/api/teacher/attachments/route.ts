import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const ownerId = (session.user as any).id as string;
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get('noteId');
  const testId = searchParams.get('testId');
  const homeworkId = searchParams.get('homeworkId');
  const lessonPlanId = searchParams.get('lessonPlanId');

  // Если передан ID документа — берём вложения этого документа + общие (без привязок)
  let where: any = { ownerId };

  if (noteId || testId || homeworkId || lessonPlanId) {
    const ors: any[] = [];
    if (noteId) ors.push({ noteId });
    if (testId) ors.push({ testId });
    if (homeworkId) ors.push({ homeworkId });
    if (lessonPlanId) ors.push({ lessonPlanId });
    ors.push({
      AND: [
        { noteId: null },
        { testId: null },
        { homeworkId: null },
        { lessonPlanId: null },
      ],
    });
    where = { ownerId, OR: ors };
  }

  const items = await prisma.attachment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 });
  }

  const { name, url, mime, size, noteId, testId, homeworkId, lessonPlanId } = body;

  if (!name || !url) {
    return NextResponse.json({ error: 'Нужны name и url' }, { status: 400 });
  }

  const created = await prisma.attachment.create({
    data: {
      ownerId: (session.user as any).id,
      name: String(name).slice(0, 200),
      url: String(url),
      mime: mime || null,
      size: typeof size === 'number' ? size : null,
      noteId: noteId || null,
      testId: testId || null,
      homeworkId: homeworkId || null,
      lessonPlanId: lessonPlanId || null,
    },
  });

  return NextResponse.json({ ok: true, attachment: created });
}