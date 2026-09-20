import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { LessonCard } from '@/components/shared/LessonCard';
import { Calendar, ArrowLeft, Plus, Clock } from 'lucide-react';

export default async function TeacherCalendarListPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const lessons = await prisma.lesson.findMany({
    where: {
      status: { not: 'CANCELLED' },
      startAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { startAt: 'asc' },
    include: {
      user: { select: { name: true, grade: true } },
      subject: { select: { name: true } },
    },
  });

  const upcoming = lessons.filter((l) => new Date(l.startAt) > new Date());
  const past = lessons.filter((l) => new Date(l.startAt) <= new Date());

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/teacher/calendar"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> К календарю
      </Link>

      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Расписание списком</h1>
            <p className="text-slate-400 text-sm">Все занятия с учениками</p>
          </div>
        </div>

        <Link
          href="/teacher/calendar/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Создать занятие
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-400" />
          Предстоящие ({upcoming.length})
        </h2>

        {upcoming.length === 0 ? (
          <div className="text-center py-16 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Нет запланированных занятий</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((l) => (
              <div key={l.id}>
                <div className="text-xs text-slate-500 mb-1 px-1">
                  👤 {l.user.name}
                  {l.user.grade && ` · ${l.user.grade} класс`}
                </div>
                <LessonCard lesson={l as any} role="teacher" />
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 opacity-60">
            Прошедшие ({past.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 20).map((l) => (
              <LessonCard key={l.id} lesson={l as any} role="teacher" past />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}