import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StudentTopicsView } from '@/components/student/StudentTopicsView';
import { StudentSubjectTabs } from '@/components/student/StudentSubjectTabs';
import Link from 'next/link';
import { BookOpen, FileText, ArrowRight, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentTopicsPage({
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
        <h1 className="text-3xl font-bold text-white mb-1">Темы</h1>
        <p className="text-slate-400">У тебя пока нет предметов</p>
      </div>
    );
  }

  let currentSubjectId: string | null = null;
  if (subjectParam && subjectIds.includes(subjectParam)) {
    currentSubjectId = subjectParam;
  } else if (subjectIds.length === 1) {
    currentSubjectId = subjectIds[0];
  }

  const topics = await prisma.topic.findMany({
    where: {
      subjectId: currentSubjectId ? currentSubjectId : { in: subjectIds },
      isActive: true,
    },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
    include: {
      subject: { select: { id: true, name: true } },
      unlocks: { where: { userId }, select: { id: true } },
      notes: { where: { published: true }, select: { id: true, title: true } },
      tests: { where: { published: true }, select: { id: true, title: true } },
      homeworks: {
        where: {
          OR: [
            { targetType: 'ALL' },
            { targetType: 'SPECIFIC', targetUserId: userId },
          ],
        },
        select: { id: true, title: true },
      },
    },
  });

  const topicsData = topics.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    order: t.order,
    subjectId: t.subjectId,
    subjectName: t.subject.name,
    isUnlocked: t.unlocks.length > 0,
    notes: t.notes,
    tests: t.tests,
    homeworks: t.homeworks,
  }));

  // Если предмет не выбран
  if (!currentSubjectId) {
    const topicsCounts: Record<string, number> = {};
    topics.forEach((t) => {
      topicsCounts[t.subjectId] = (topicsCounts[t.subjectId] || 0) + 1;
    });

    return (
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Темы</h1>
          <p className="text-slate-400 text-sm">
            Выбери предмет, чтобы посмотреть темы
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-8">
          <Link
            href="/student/notes"
            className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-emerald-500/30 transition flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">Все конспекты</div>
              <div className="text-xs text-slate-500">Собрание материалов</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
          </Link>

          <Link
            href="/student/tests"
            className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-blue-500/30 transition flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">Все тесты</div>
              <div className="text-xs text-slate-500">Список всех тестов</div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
          </Link>
        </div>

        <StudentSubjectTabs
          basePath="/student/topics"
          subjects={userSubjects.map((us) => ({
            id: us.subject.id,
            name: us.subject.name,
            category: us.subject.category,
            count: topicsCounts[us.subject.id] || 0,
          }))}
          currentSubjectId={null}
        />
      </div>
    );
  }

  const currentSubject = userSubjects.find(
    (us) => us.subjectId === currentSubjectId
  )?.subject;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {currentSubject?.name || 'Темы'}
            </h1>
            <p className="text-slate-400 text-sm">
              Учитель открывает темы по мере прохождения
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <Link
          href="/student/notes"
          className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-emerald-500/30 transition flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">Все конспекты</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
        </Link>

        <Link
          href="/student/tests"
          className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-blue-500/30 transition flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-sm">Все тесты</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
        </Link>
      </div>

      <StudentSubjectTabs
        basePath="/student/topics"
        subjects={userSubjects.map((us) => ({
          id: us.subject.id,
          name: us.subject.name,
          category: us.subject.category,
        }))}
        currentSubjectId={currentSubjectId}
      />

      <StudentTopicsView topics={topicsData} />
    </div>
  );
}