import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookMarked, Plus, Eye, Clock } from 'lucide-react';
import { sortByNumber } from '@/lib/sortByNumber';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPlansPage() {
  const plans = await prisma.lessonPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { name: true } } },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
            <BookMarked className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Методички</h1>
            <p className="text-slate-400 text-sm">
              Детальные материалы для проведения занятий ({plans.length})
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

      {plans.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет методичек</p>
          <Link
            href="/teacher/lesson-plans/new"
            className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Создать первую →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((p) => (
            <Link key={p.id} href={`/teacher/lesson-plans/${p.id}`}>
              <div className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition">
                <div className="p-2 rounded-lg bg-indigo-500/20 flex-shrink-0">
                  <BookMarked className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate font-medium">
                    {p.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                      {p.subject.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.duration} мин
                    </span>
                    {p.published ? (
                      <span className="text-emerald-400">✓ опубликована</span>
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
}