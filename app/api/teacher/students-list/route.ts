import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'TEACHER') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', status: 'APPROVED' },
    select: {
      id: true,
      name: true,
      grade: true,
      email: true,
      userSubjects: {
        select: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Преобразуем в удобный формат
  const result = students.map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    email: s.email,
    subjects: s.userSubjects.map((us) => us.subject),
  }));

  return NextResponse.json(result);
}