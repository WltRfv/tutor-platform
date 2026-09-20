import { prisma } from '@/lib/prisma';
import { ApplicationsList } from '@/components/teacher/ApplicationsList';

export default async function ApplicationsPage() {
  const applications = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      userSubjects: {
        include: { subject: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Заявки на регистрацию
        </h1>
        <p className="text-slate-400">
          {applications.length === 0
            ? 'Все заявки обработаны'
            : `Ожидают рассмотрения: ${applications.length}`}
        </p>
      </div>

      <ApplicationsList
        initial={applications.map((app) => ({
          id: app.id,
          name: app.name,
          email: app.email,
          grade: app.grade,
          phone: app.phone,
          createdAt: app.createdAt.toISOString(),
          subjects: app.userSubjects.map((us) => us.subject),
        }))}
      />
    </div>
  );
}