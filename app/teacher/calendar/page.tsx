import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, Plus, List } from 'lucide-react';
import { CalendarView } from '@/components/shared/CalendarView';

const SUBJECT_COLORS: Record<string, string> = {
  math: '#a855f7',
  algebra: '#3b82f6',
  geometry: '#10b981',
  informatics: '#06b6d4',
  vpr: '#f59e0b',
  oge: '#ef4444',
  transfer: '#ec4899',
};

export default async function TeacherCalendarPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const lessons = await prisma.lesson.findMany({
    where: {
      status: { not: 'CANCELLED' },
      startAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { startAt: 'asc' },
    include: {
      user: { select: { name: true, grade: true } },
      subject: { select: { name: true, category: true } },
    },
  });

  const events = lessons.map((l) => ({
    id: l.id,
    title: `${l.user.name} · ${l.subject.name}`,
    start: l.startAt.toISOString(),
    end: l.endAt.toISOString(),
    backgroundColor: SUBJECT_COLORS[l.subject.category] || '#a855f7',
    extendedProps: {
      telemostLink: l.telemostLink,
      boardLink: l.boardLink,
      subjectName: l.subject.name,
      userName: l.user.name,
      role: 'teacher' as const,
      editUrl: `/teacher/calendar/${l.id}/edit`,
    },
  }));

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Расписание</h1>
            <p className="text-slate-400 text-sm">
              Всего занятий: {lessons.length}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/teacher/calendar/list"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition"
          >
            <List className="h-4 w-4" />
            Списком
          </Link>
          <Link
            href="/teacher/calendar/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
          >
            <Plus className="h-4 w-4" />
            Создать занятие
          </Link>
        </div>
      </div>

      <CalendarView events={events} initialView="timeGridWeek" />

      <div className="mt-6 flex flex-wrap gap-3 text-xs">
        {Object.entries(SUBJECT_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-slate-400 capitalize">
              {cat === 'math' && 'Математика'}
              {cat === 'algebra' && 'Алгебра'}
              {cat === 'geometry' && 'Геометрия'}
              {cat === 'informatics' && 'Информатика'}
              {cat === 'vpr' && 'ВПР'}
              {cat === 'oge' && 'ОГЭ'}
              {cat === 'transfer' && 'Переводной'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}