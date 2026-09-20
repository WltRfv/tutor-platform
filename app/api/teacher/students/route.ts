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
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      grade: true,
      phone: true,
      messengerLink: true,
      createdAt: true,
      userSubjects: {
        select: {
          id: true,
          addedBy: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // Собираем статистику
  const result = await Promise.all(
    students.map(async (s) => {
      const activityCount = await prisma.activity.count({ where: { userId: s.id } });
      const submissions = await prisma.submission.findMany({
        where: { userId: s.id },
        select: { score: true },
      });
      const avgScore =
        submissions.length > 0
          ? Math.round(
              submissions.reduce((sum, x) => sum + (x.score || 0), 0) / submissions.length
            )
          : null;
      const homeworksCount = await prisma.homeworkSubmission.count({
        where: { userId: s.id },
      });

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        grade: s.grade,
        phone: s.phone,
        messengerLink: s.messengerLink,
        createdAt: s.createdAt,
        subjects: s.userSubjects.map((us) => ({
          userSubjectId: us.id,
          addedBy: us.addedBy,
          ...us.subject,
        })),
        activityCount,
        submissionsCount: submissions.length,
        homeworksCount,
        avgScore,
      };
    })
  );

  return NextResponse.json(result);
}