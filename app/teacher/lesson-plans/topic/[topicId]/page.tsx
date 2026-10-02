import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookMarked,
  Eye,
  Clock,
  Layers,
  Plus,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPlanTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ subject?: string }>;
}) {
  const { topicId } = await params;
  const { subject: subjectFromQuery } = await searchParams;

  // Если topicId === 'no-topic' — показываем методички без темы
  const isNoTopic = topicId === 'no-topic';

  let topicTitle = 'Без темы';
  let subjectName = '';
  let subjectId = subjectFromQuery ?? '';
  let plans: any[] = [];

  if (isNoTopic) {
    if (!subjectFromQuery) notFound();
    const subj = await prisma.subjects.findUnique({
      where: { id: subjectFromQuery },
      select: { name: true },
    });
    if (!subj) notFound();
    subjectName = subj.name;

    plans = await prisma.lessonPlan.findMany({
      where: { subjectId: subjectFromQuery, topicId: null },
      orderBy: { createdAt: 'asc' },
    });
  } else {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: { select: { id: true, name: true } } },
    });
    if (!topic) notFound();

    topicTitle = topic.title;
    subjectName = topic.subject.name;
    subjectId = topic.subject.id;

    plans = await prisma.lessonPlan.findMany({
      where: { topicId },
      orderBy: { createdAt: 'asc' },
    });
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href={`/teacher/lesson-plans?subject=${subjectId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к темам {subjectName}
      </Link>

      <div className="mb-8 flex items-start gap-4 flex-wrap">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg flex-shrink-0">
          <Layers className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-1">{topicTitle}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200">
              {subjectName}
            </span>
            <span className="flex items-center gap-1">
              <BookMarked className="h-3.5 w-3.5" /> {plans.length}{' '}
              {plans.length === 1
                ? 'методичка'
                : plans.length >= 2 && plans.length <= 4
                ? 'методички'
                : 'методичек'}
            </span>
          </div>
        </div>
        <Link
          href={`/teacher/lesson-plans/new?topicId=${isNoTopic ? '' : topicId}&subjectId=${subjectId}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
        >
          <Plus className="h-4 w-4" />
          Создать методичку
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока пусто — создай методичку для этой темы</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <Link key={p.id} href={`/teacher/lesson-plans/${p.id}`}>
              <div className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-indigo-500/40 transition flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex-shrink-0 shadow-lg">
                  <BookMarked className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate mb-1">
                    {p.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.duration} мин
                    </span>
                    {p.published ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> готова
                      </span>
                    ) : (
                      <span>черновик</span>
                    )}
                  </div>
                </div>
                <Eye className="h-4 w-4 text-slate-500 group-hover:text-white transition flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}