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
  const body = await req.json();

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...(body.subjectId && { subjectId: body.subjectId }),
      ...(body.topic !== undefined && { topic: body.topic }),
      ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
      ...(body.type && { type: body.type }),
      ...(body.text !== undefined && { text: body.text }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.options !== undefined && { options: body.options }),
      ...(body.correct !== undefined && { correct: body.correct }),
      ...(body.correctMulti !== undefined && { correctMulti: body.correctMulti }),
      ...(body.correctText !== undefined && { correctText: body.correctText }),
      ...(body.matchMode !== undefined && { matchMode: body.matchMode }),
      ...(body.correctNumber !== undefined && { correctNumber: body.correctNumber }),
      ...(body.tolerance !== undefined && { tolerance: body.tolerance }),
      ...(body.correctBool !== undefined && { correctBool: body.correctBool }),
      ...(body.explanation !== undefined && { explanation: body.explanation }),
      ...(body.points !== undefined && { points: body.points }),
    },
  });

  return NextResponse.json({ ok: true, question });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.question.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}