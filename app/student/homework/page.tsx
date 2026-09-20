import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Globe,
  User as UserIcon,
} from 'lucide-react';
import { StudentSubjectTabs } from '@/components/student/StudentSubjectTabs';

export default async function StudentHomeworkPage({
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
        <h1 className="text-3xl font-bold text-white mb-1">
          Домашние задания
        </h1>
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
    const allHW = await prisma.homework.findMany({
      where: {
        OR: [
          {
            targetType: 'ALL',
            subjectId: { in: subjectIds },
            OR: [{ topicId: null }, { topicId: { in: unlockedTopicIds } }],
          },
          { targetType: 'SPECIFIC', targetUserId: userId },
        ],
      },
      select: { subjectId: true },
    });

    const counts: Record<string, number> = {};
    allHW.forEach((h) => {
      counts[h.subjectId] = (counts[h.subjectId] || 0) + 1;
    });

    return (
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Домашние задания
          </h1>
          <p className="text-slate-400 text-sm">
            Выбери предмет, чтобы посмотреть задания
          </p>
        </div>
        <StudentSubjectTabs
          basePath="/student/homework"
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

  const homeworks = await prisma.homework.findMany({
    where: {
      OR: [
        {
          targetType: 'ALL',
          subjectId: currentSubjectId,
          OR: [{ topicId: null }, { topicId: { in: unlockedTopicIds } }],
        },
        {
          targetType: 'SPECIFIC',
          targetUserId: userId,
          subjectId: currentSubjectId,
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      teacher: { select: { name: true } },
      subject: { select: { name: true } },
      submissions: {
        where: { userId },
        orderBy: { version: 'desc' },
      },
    },
  });

  const currentSubject = userSubjects.find(
    (us) => us.subjectId === currentSubjectId
  )?.subject;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          {currentSubject?.name || 'Домашние задания'}
        </h1>
        <p className="text-slate-400 text-sm">
          Всего заданий: {homeworks.length}
        </p>
      </div>

      <StudentSubjectTabs
        basePath="/student/homework"
        subjects={userSubjects.map((us) => ({
          id: us.subject.id,
          name: us.subject.name,
          category: us.subject.category,
        }))}
        currentSubjectId={currentSubjectId}
      />

      {homeworks.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет заданий по этому предмету</p>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworks.map((hw) => {
            const lastSub = hw.submissions[0];
            const isSubmitted = !!lastSub;
            const isReviewed = lastSub?.status === 'REVIEWED';
            const needsRevision = lastSub?.status === 'NEEDS_REVISION';
            const overdue =
              hw.dueDate && new Date(hw.dueDate) < new Date() && !isSubmitted;

            return (
              <Link
                key={hw.id}
                href={`/student/homework/${hw.id}`}
                className="block group"
              >
                <div
                  className={`relative backdrop-blur-xl bg-white/5 border rounded-2xl p-5 hover:border-purple-500/30 transition flex items-center gap-4 ${
                    needsRevision
                      ? 'border-orange-500/40'
                      : isReviewed
                      ? 'border-emerald-500/30'
                      : 'border-white/10'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 ${
                      isReviewed
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                        : needsRevision
                        ? 'bg-gradient-to-br from-orange-500 to-red-500'
                        : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    }`}
                  >
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold truncate">
                        {hw.title}
                      </h3>
                      {isReviewed && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Проверено
                        </span>
                      )}
                      {needsRevision && (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <AlertCircle className="h-3 w-3" /> На доработку
                        </span>
                      )}
                      {overdue && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <Clock className="h-3 w-3" /> Просрочено
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      {hw.topicName && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200">
                          {hw.topicName}
                        </span>
                      )}
                      {hw.targetType === 'SPECIFIC' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 flex items-center gap-1">
                          <UserIcon className="h-3 w-3" /> Лично тебе
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Для всех
                        </span>
                      )}
                      {hw.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          до {new Date(hw.dueDate).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {lastSub && (
                        <span className="text-slate-500">
                          v{lastSub.version}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}