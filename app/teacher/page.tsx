import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherHome() {
  const session = await auth();
  if (!session) redirect('/login');

  const pendingCount = await prisma.user.count({ where: { status: 'PENDING' } });
  const studentsCount = await prisma.user.count({
    where: { role: 'STUDENT', status: 'APPROVED' },
  });
  const notesCount = await prisma.note.count();
  const testsCount = await prisma.test.count();
  const homeworksCount = await prisma.homework.count();
  const unreviewedHW = await prisma.homeworkSubmission.count({
    where: { status: 'SUBMITTED' },
  });

  const recentApps = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const recentHW = await prisma.homeworkSubmission.findMany({
    where: { status: 'SUBMITTED' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: { select: { name: true } },
      homework: { select: { title: true } },
    },
  });

  // Активность за 7 дней (упрощённый график)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekActivity = await prisma.activity.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { createdAt: true },
  });

  const dailyCounts: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dailyCounts[key] = 0;
  }
  weekActivity.forEach((a) => {
    const key = new Date(a.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
    if (dailyCounts[key] !== undefined) dailyCounts[key]++;
  });
  const maxDaily = Math.max(...Object.values(dailyCounts), 1);

  const stats = [
    {
      label: 'Новых заявок',
      value: pendingCount,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      href: '/teacher/applications',
    },
    {
      label: 'Учеников',
      value: studentsCount,
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
      href: '/teacher/students',
    },
    {
      label: 'Конспектов',
      value: notesCount,
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-500',
      href: '/teacher/content',
    },
    {
      label: 'Тестов',
      value: testsCount,
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      href: '/teacher/content',
    },
  ];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Привет, {session.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400">Вот что происходит сегодня</p>
      </div>

      {/* Плашка "На проверку" */}
      {unreviewedHW > 0 && (
        <Link
          href="/teacher/homework"
          className="block mb-6 group"
        >
          <div className="backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 hover:border-amber-500/50 transition flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-lg">
                {unreviewedHW} {unreviewedHW === 1 ? 'сдача' : 'сдачи'} ждёт проверки
              </div>
              <div className="text-sm text-amber-300">
                Открой задания и поставь оценку ученикам
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-amber-400 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      )}

      {/* 4 карточки статистики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <Link key={i} href={s.href}>
            <div className="relative group h-full">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity`}
              />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all h-full">
                <div
                  className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${s.color} mb-3 shadow-lg`}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* График активности за неделю */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Активность за 7 дней
          </h2>
          <span className="text-xs text-slate-500">
            Всего: {weekActivity.length} событий
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {Object.entries(dailyCounts).map(([day, count]) => (
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
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Последние заявки */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Последние заявки</h2>
            <Link
              href="/teacher/applications"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              Новых заявок нет
            </p>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition"
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
                  <div className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Последние сдачи ДЗ */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Свежие сдачи ДЗ</h2>
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
            <div className="space-y-3">
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
                  <div className="text-xs text-amber-400 flex-shrink-0">
                    на проверку
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 mt-6">
        {[
          {
            href: '/teacher/applications',
            label: 'Обработать заявки',
            icon: Users,
            color: 'text-purple-400',
          },
          {
            href: '/teacher/homework',
            label: 'Проверить ДЗ',
            icon: ClipboardList,
            color: 'text-blue-400',
          },
          {
            href: '/teacher/content',
            label: 'Создать контент',
            icon: BookOpen,
            color: 'text-emerald-400',
          },
          {
            href: '/teacher/students',
            label: 'Список учеников',
            icon: GraduationCap,
            color: 'text-orange-400',
          },
        ].map((a, i) => (
          <Link
            key={i}
            href={a.href}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition group"
          >
            <a.icon className={`h-5 w-5 ${a.color}`} />
            <span className="text-sm text-slate-200 flex-1">{a.label}</span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}