import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Video,
  TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherHome() {
  const session = await auth();
  if (!session) redirect('/login');

  const pendingCount = await prisma.user.count({ where: { status: 'PENDING' } });
  const unreviewedHW = await prisma.homeworkSubmission.count({
    where: { status: 'SUBMITTED' },
  });

  const recentApps = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  const recentHW = await prisma.homeworkSubmission.findMany({
    where: { status: 'SUBMITTED' },
    orderBy: { createdAt: 'desc' },
    take: 4,
    include: {
      user: { select: { name: true } },
      homework: { select: { title: true } },
    },
  });

  const now = new Date();
  const upcomingLessons = await prisma.lesson.findMany({
    where: { startAt: { gte: now }, status: 'SCHEDULED' },
    orderBy: { startAt: 'asc' },
    take: 5,
    include: {
      user: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  // Активность за 7 дней
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekActivity = await prisma.activity.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { createdAt: true },
  });

  const dailyCounts: Record<string, number> = {};
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dailyCounts[key] = 0;
    dayKeys.push(key);
  }
  weekActivity.forEach((a) => {
    const key = new Date(a.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
    if (dailyCounts[key] !== undefined) dailyCounts[key]++;
  });
  const maxDaily = Math.max(...Object.values(dailyCounts), 1);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Привет, {session.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400">Вот что важно на сегодня</p>
      </div>

      {/* Алерты */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {pendingCount > 0 && (
          <Link href="/teacher/applications" className="group">
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-5 hover:border-purple-500/50 transition flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/30">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {pendingCount}{' '}
                  {pendingCount === 1 ? 'заявка' : pendingCount < 5 ? 'заявки' : 'заявок'}
                </div>
                <div className="text-xs text-purple-300">Ожидают одобрения</div>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        )}

        {unreviewedHW > 0 && (
          <Link href="/teacher/homework" className="group">
            <div className="backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 hover:border-amber-500/50 transition flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {unreviewedHW}{' '}
                  {unreviewedHW === 1
                    ? 'сдача'
                    : unreviewedHW < 5
                    ? 'сдачи'
                    : 'сдач'}
                </div>
                <div className="text-xs text-amber-300">Ждут проверки</div>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        )}

        {pendingCount === 0 && unreviewedHW === 0 && (
          <div className="sm:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Всё под контролем 🎉</div>
              <div className="text-xs text-slate-400">
                Нет новых заявок и сдач на проверку
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Активность за 7 дней */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Активность учеников за 7 дней
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Всего: {weekActivity.length} событий
            </span>
            <Link
              href="/teacher/admin/activity"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Подробнее <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {dayKeys.map((day) => {
            const count = dailyCounts[day];
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-purple-500/60 to-blue-500/80 transition-all hover:from-purple-400 hover:to-blue-400"
                    style={{
                      height: `${Math.max((count / maxDaily) * 100, 4)}%`,
                      minHeight: '6px',
                    }}
                    title={`${count} событий`}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ближайшие занятия */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Ближайшие занятия
          </h2>
          <Link
            href="/teacher/calendar"
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Календарь <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {upcomingLessons.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-sm text-slate-500">
            Нет запланированных занятий
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/5">
            {upcomingLessons.map((l) => (
              <div key={l.id} className="p-4 flex items-center gap-4">
                <div className="text-center w-14 flex-shrink-0">
                  <div className="text-2xl font-bold text-white">
                    {new Date(l.startAt).getDate()}
                  </div>
                  <div className="text-[10px] uppercase text-slate-500">
                    {new Date(l.startAt).toLocaleDateString('ru-RU', {
                      month: 'short',
                    })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {l.user.name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {l.subject.name}
                    {l.title ? ` · ${l.title}` : ''}
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {new Date(l.startAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {l.telemostLink && (
                  <a
                    href={l.telemostLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition"
                    title="Открыть занятие"
                  >
                    <Video className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Заявки + Сдачи */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Новые заявки</h2>
            <Link
              href="/teacher/applications"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">Заявок нет</p>
          ) : (
            <div className="space-y-2">
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {app.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{app.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Свежие сдачи</h2>
            <Link
              href="/teacher/homework"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentHW.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              Ничего не сдано
            </p>
          ) : (
            <div className="space-y-2">
              {recentHW.map((hw) => (
                <div
                  key={hw.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {hw.user.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {hw.homework.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}