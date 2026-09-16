import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default async function TeacherHome() {
  const session = await auth();
  if (!session) redirect('/login');

  const pendingCount = await prisma.user.count({ where: { status: 'PENDING' } });
  const studentsCount = await prisma.user.count({ where: { role: 'STUDENT', status: 'APPROVED' } });
  const notesCount = await prisma.note.count();
  const testsCount = await prisma.test.count();
  const recentApps = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
 

  const stats = [
    { label: 'Новых заявок', value: pendingCount, icon: Users, color: 'from-purple-500 to-pink-500', href: '/teacher/applications' },
    { label: 'Учеников', value: studentsCount, icon: GraduationCap, color: 'from-blue-500 to-cyan-500', href: '/teacher/students' },
    { label: 'Конспектов', value: notesCount, icon: BookOpen, color: 'from-emerald-500 to-teal-500', href: '/teacher/content' },
    { label: 'Тестов', value: testsCount, icon: TrendingUp, color: 'from-orange-500 to-red-500', href: '/teacher/content' },
  ];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Привет, {session.user?.name}! 👋
        </h1>
        <p className="text-slate-400">
          Вот что происходит сегодня
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Link key={i} href={s.href}>
            <div className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity`} />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${s.color} mb-3 shadow-lg`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent applications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
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
              Новых заявок пока нет
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
                    <div className="text-sm font-medium text-white truncate">{app.name}</div>
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

        {/* Быстрые действия */}
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Быстрые действия</h2>
          <div className="space-y-2">
            {[
              { href: '/teacher/applications', label: 'Обработать заявки', icon: Users, color: 'text-purple-400' },
              { href: '/teacher/content', label: 'Создать конспект', icon: BookOpen, color: 'text-emerald-400' },
              { href: '/teacher/calendar', label: 'Открыть расписание', icon: Calendar, color: 'text-blue-400' },
            ].map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition group"
              >
                <a.icon className={`h-4 w-4 ${a.color}`} />
                <span className="text-sm text-slate-200 flex-1">{a.label}</span>
                <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}