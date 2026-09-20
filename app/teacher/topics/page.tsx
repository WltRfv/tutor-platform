import { prisma } from '@/lib/prisma';
import { TopicsManager } from '@/components/teacher/TopicsManager';

export default async function TopicsPage() {
  const subjects = await prisma.subjects.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, code: true },
  });

  const topics = await prisma.topic.findMany({
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
    include: {
      subject: { select: { name: true, id: true } },
      _count: { select: { notes: true, tests: true, homeworks: true } },
    },
  });

  return (
    <div className="p-8 max-w-6xl">
      <TopicsManager subjects={subjects} initialTopics={topics as any} />
    </div>
  );
}