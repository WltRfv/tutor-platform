import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CalendarView } from '@/components/shared/CalendarView';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUBJECT_COLORS: Record<string, string> = {
  math: '#a855f7',
  algebra: '#3b82f6',
  geometry: '#10b981',
  informatics: '#06b6d4',
  vpr: '#f59e0b',
  oge: '#ef4444',
  transfer: '#ec4899',
};

export default async function StudentCalendarPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;

  const lessons = await prisma.lesson.findMany({
    where: {
      userId,
      status: { not: 'CANCELLED' },
      startAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { startAt: 'asc' },
    include: {
      subject: { select: { name: true, category: true } },
    },
  });

  const events = lessons.map((l) => ({
    id: l.id,
    title: l.title || l.subject.name,
    start: l.startAt.toISOString(),
    end: l.endAt.toISOString(),
    backgroundColor: SUBJECT_COLORS[l.subject.category] || '#a855f7',
    extendedProps: {
      telemostLink: l.telemostLink,
      boardLink: l.boardLink,
      subjectName: l.subject.name,
      userName: 'С репетитором',
      role: 'student' as const,
    },
  }));

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Расписание</h1>
          <p className="text-slate-400 text-sm">
            Твои занятия с репетитором ({lessons.length})
          </p>
        </div>
      </div>

      <CalendarView events={events} initialView="timeGridWeek" />

      <p className="text-xs text-slate-500 mt-6 text-center">
        💡 Клик по занятию откроет ссылки на Телемост и онлайн-доску
      </p>
    </div>
  );
}