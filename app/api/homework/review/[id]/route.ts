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
  const { status, teacherComment, grade } = await req.json();

  const submission = await prisma.homeworkSubmission.update({
    where: { id },
    data: {
      status: status || 'REVIEWED',
      teacherComment: teacherComment || null,
      grade: typeof grade === 'number' ? grade : null,
    },
  });

  return NextResponse.json({ ok: true, submission });
}