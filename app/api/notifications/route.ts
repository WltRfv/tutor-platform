import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  // Получаем время последнего прочтения каждого типа
  const reads = await prisma.notificationRead.findMany({
    where: { userId },
  });
  const readMap = new Map(reads.map((r) => [r.type, r.lastReadAt]));

  // Если никогда не читал — считаем с этого момента (сутки назад)
  const defaultFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const getFrom = (type: string) => readMap.get(type) || defaultFrom;

  if (role === 'TEACHER') {
    const appsFrom = getFrom('applications');
    const hwFrom = getFrom('homework');

    const pendingApps = await prisma.user.count({
      where: { status: 'PENDING', createdAt: { gt: appsFrom } },
    });
    const unreviewedHW = await prisma.homeworkSubmission.count({
      where: { status: 'SUBMITTED', createdAt: { gt: hwFrom } },
    });

    return NextResponse.json({
      total: pendingApps + unreviewedHW,
      items: [
        {
          type: 'applications',
          count: pendingApps,
          label: 'Новых заявок',
          href: '/teacher/applications',
        },
        {
          type: 'homework',
          count: unreviewedHW,
          label: 'ДЗ на проверку',
          href: '/teacher/homework',
        },
      ].filter((i) => i.count > 0),
    });
  }

  // Ученик
  const reviewsFrom = getFrom('reviews');
  const homeworksFrom = getFrom('homeworks');

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId },
    select: { subjectId: true },
  });
  const subjectIds = userSubjects.map((us) => us.subjectId);

  const recentReviews = await prisma.homeworkSubmission.count({
    where: {
      userId,
      status: { in: ['REVIEWED', 'NEEDS_REVISION'] },
      updatedAt: { gt: reviewsFrom },
    },
  });

  const newHomeworks = subjectIds.length
    ? await prisma.homework.count({
        where: {
          OR: [
            { targetType: 'ALL', subjectId: { in: subjectIds } },
            { targetType: 'SPECIFIC', targetUserId: userId },
          ],
          createdAt: { gt: homeworksFrom },
          submissions: { none: { userId } },
        },
      })
    : 0;

  return NextResponse.json({
    total: recentReviews + newHomeworks,
    items: [
      {
        type: 'reviews',
        count: recentReviews,
        label: 'Новых оценок',
        href: '/student/homework',
      },
      {
        type: 'homeworks',
        count: newHomeworks,
        label: 'Новых заданий',
        href: '/student/homework',
      },
    ].filter((i) => i.count > 0),
  });
}