import { prisma } from '@/lib/prisma';
import { RetakeRequestsList } from '@/components/teacher/RetakeRequestsList';

export default async function RetakesPage() {
  const requests = await prisma.retakeRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, grade: true, email: true } },
      test: {
        select: {
          id: true,
          title: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Запросы на пересдачу
        </h1>
        <p className="text-slate-400">
          {requests.length === 0
            ? 'Нет активных запросов'
            : `Активных: ${requests.length}`}
        </p>
      </div>

      <RetakeRequestsList
        initial={requests.map((r) => ({
          id: r.id,
          status: r.status,
          reason: r.reason,
          createdAt: r.createdAt.toISOString(),
          user: r.user,
          test: {
            id: r.test.id,
            title: r.test.title,
            subjectName: r.test.subject.name,
          },
        }))}
      />
    </div>
  );
}