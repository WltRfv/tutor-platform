import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TestPageClient } from '@/components/student/TestPageClient';

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const userId = (session.user as any).id;

  const test = await prisma.test.findUnique({
    where: { id },
    include: { subject: { select: { name: true } } },
  });

  if (!test || !test.published) notFound();

  const submissions = await prisma.submission.findMany({
    where: { testId: id, userId },
    orderBy: { version: 'desc' },
    select: { id: true, version: true, score: true, createdAt: true },
  });

  const retakeRequests = await prisma.retakeRequest.findMany({
    where: { testId: id, userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const approvedUnused = retakeRequests.find(
    (r) => r.status === 'APPROVED'
  );

  return (
    <TestPageClient
      test={{
        id: test.id,
        title: test.title,
        subjectName: test.subject.name,
        timeLimit: test.timeLimit,
        attemptsAllowed: test.attemptsAllowed,
        questions: (test.questions as any[]) || [],
      }}
      submissions={submissions.map((s) => ({
        id: s.id,
        version: s.version,
        score: s.score,
        createdAt: s.createdAt.toISOString(),
      }))}
      retakeRequests={retakeRequests.map((r) => ({
        id: r.id,
        status: r.status,
        reason: r.reason,
        teacherNote: r.teacherNote,
        createdAt: r.createdAt.toISOString(),
      }))}
      hasApprovedRetake={!!approvedUnused}
    />
  );
}