import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookMarked, Plus, Eye, Clock, Layers, ArrowLeft } from 'lucide-react';
import { StudentSubjectTabs } from '@/components/student/StudentSubjectTabs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject: subjectParam } = await searchParams;

  const subjects = await prisma.subjects.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, code: true, name: true, category: true },
  });

  const counts = await prisma.lessonPlan.groupBy({
    by: ['subjectId'],
    _count: true,
  });
  const countsMap: Record<string, number> = {};
  counts.forEach((c) => {
    countsMap[c.subjectId] = c._count;
  });

  // === Уровень 1: плитки предметов ===
  if (!subjectParam) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Методички</h1>
          <p className="text-slate-400 text-sm">
            Выбери предмет, чтобы открыть темы и уроки
          </p>
        </div>

        <StudentSubjectTabs
          basePath="/teacher/lesson-plans"
          subjects={subjects.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            count: countsMap[s.id] || 0,
          }))}
          currentSubjectId={null}
        />

        <p className="text-xs text-slate-500 mt-6 text-center">
          💡 Методички видишь только ты — ученикам они не показываются
        </p>
      </div>
    );
  }

  // === Уровень 2: темы внутри предмета ===
  const currentSubject = subjects.find((s) => s.id === subjectParam);
  if (!currentSubject) {
    return (
      <div className="p-8 max-w-5xl">
        <p className="text-slate-400">Предмет не найден</p>
        <Link
          href="/teacher/lesson-plans"
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          ← Все предметы
        </Link>
      </div>
    );
  }

  const topics = await prisma.topic.findMany({
    where: { subjectId: subjectParam, isActive: true },
    orderBy: { order: 'asc' },
    include: {
      lessonPlans: { orderBy: { createdAt: 'asc' } },
    },
  });

  const plansWithoutTopic = await prisma.lessonPlan.findMany({
    where: { subjectId: subjectParam, topicId: null },
    orderBy: { createdAt: 'asc' },
  });

  const totalPlans = topics.reduce((sum, t) => sum + t.lessonPlans.length, 0) + plansWithoutTopic.length;

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/teacher/lesson-plans"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Все предметы
      </Link>

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
            <BookMarked className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentSubject.name}</h1>
            <p className="text-slate-400 text-sm">
              Тем: {topics.length} · Методичек: {totalPlans}
            </p>
          </div>
        </div>

        <Link
          href="/teacher/lesson-plans/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
        >
          <Plus className="h-4 w-4" />
          Создать методичку
        </Link>
      </div>

      <StudentSubjectTabs
        basePath="/teacher/lesson-plans"
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          count: countsMap[s.id] || 0,
        }))}
        currentSubjectId={subjectParam}
      />

      {topics.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>По этому предмету пока нет тем</p>
        </div>
      ) : (
        <div className="space-y-5">
          {topics.map((t) => {
            const plans = t.lessonPlans;
            return (
              <div
                key={t.id}
                className="rounded-2xl bg-white/5 border border-white/10 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white">
                      {t.title}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {plans.length} методичек
                    </p>
                  </div>
                </div>

                {plans.length === 0 ? (
                  <p className="text-sm text-slate-500 pl-11">
                    Пока пусто — создай методичку для этой темы
                  </p>
                ) : (
                  <div className="space-y-2">
                    {plans.map((p) => (
                      <Link key={p.id} href={`/teacher/lesson-plans/${p.id}`}>
                        <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition">
                          <BookMarked className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {p.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {p.duration} мин
                              </span>
                              {p.published ? (
                                <span className="text-emerald-400">
                                  ✓ готова
                                </span>
                              ) : (
                                <span>черновик</span>
                              )}
                            </div>
                          </div>
                          <Eye className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {plansWithoutTopic.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Без темы
              </h2>
              <div className="space-y-2">
                {plansWithoutTopic.map((p) => (
                  <Link key={p.id} href={`/teacher/lesson-plans/${p.id}`}>
                    <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition">
                      <BookMarked className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <Clock className="h-3 w-3" /> {p.duration} мин
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}