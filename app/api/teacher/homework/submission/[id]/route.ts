import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  const { status, teacherComment, gradeEmoji } = await req.json();

  if (!['REVIEWED', 'NEEDS_REVISION'].includes(status)) {
    return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });
  }

  const submission = await prisma.homeworkSubmission.update({
    where: { id },
    data: {
      status,
      teacherComment: teacherComment || null,
      gradeEmoji: gradeEmoji || null,
    },
  });

  return NextResponse.json({ ok: true, submission });
}