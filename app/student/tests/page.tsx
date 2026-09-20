import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StudentSubjectTabs } from '@/components/student/StudentSubjectTabs';

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const { subject: subjectParam } = await searchParams;

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId },
    include: {
      subject: { select: { id: true, name: true, category: true } },
    },
    orderBy: { subject: { order: 'asc' } },
  });

  const subjectIds = userSubjects.map((us) => us.subjectId);

  if (subjectIds.length === 0) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-1">Все тесты</h1>
        <p className="text-slate-400 mb-6">У тебя пока нет предметов</p>
      </div>
    );
  }

  let currentSubjectId: string | null = null;
  if (subjectParam && subjectIds.includes(subjectParam)) {
    currentSubjectId = subjectParam;
  } else if (subjectIds.length === 1) {
    currentSubjectId = subjectIds[0];
  }

  const unlocks = await prisma.topicUnlock.findMany({
    where: { userId },
    select: { topicId: true },
  });
  const unlockedTopicIds = unlocks.map((u) => u.topicId);

  if (!currentSubjectId) {
    const allTests = await prisma.test.findMany({
      where: {
        published: true,
        subjectId: { in: subjectIds },
        OR: [{ topicId: null }, { topicId: { in: unlockedTopicIds } }],
      },
      select: { subjectId: true },
    });

    const counts: Record<string, number> = {};
    allTests.forEach((t) => {
      counts[t.subjectId] = (counts[t.subjectId] || 0) + 1;
    });

    return (
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Все тесты</h1>
          <p className="text-slate-400 text-sm">
            Выбери предмет, чтобы посмотреть тесты
          </p>
        </div>
        <StudentSubjectTabs
          basePath="/student/tests"
          subjects={userSubjects.map((us) => ({
            id: us.subject.id,
            name: us.subject.name,
            category: us.subject.category,
            count: counts[us.subject.id] || 0,
          }))}
          currentSubjectId={null}
        />
      </div>
    );
  }

  const tests = await prisma.test.findMany({
    where: {
      published: true,
      subjectId: currentSubjectId,
      OR: [{ topicId: null }, { topicId: { in: unlockedTopicIds } }],
    },
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { name: true } } },
  });

  const submissions = await prisma.submission.findMany({
    where: { userId, testId: { not: null } },
  });
  const submittedIds = new Set(submissions.map((s) => s.testId));

  const currentSubject = userSubjects.find(
    (us) => us.subjectId === currentSubjectId
  )?.subject;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          {currentSubject?.name || 'Тесты'}
        </h1>
        <p className="text-slate-400 text-sm">Доступно тестов: {tests.length}</p>
      </div>

      <StudentSubjectTabs
        basePath="/student/tests"
        subjects={userSubjects.map((us) => ({
          id: us.subject.id,
          name: us.subject.name,
          category: us.subject.category,
        }))}
        currentSubjectId={currentSubjectId}
      />

      {tests.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет доступных тестов по этому предмету</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const done = submittedIds.has(test.id);
            return (
              <Link
                key={test.id}
                href={`/student/tests/${test.id}`}
                className="block group"
              >
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold truncate">
                        {test.title}
                      </h3>
                      {done && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {test.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {test.timeLimit} мин
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}