import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Activity,
  Code2,
  FileText,
  MessageSquare,
  Shield,
  Users,
  Server,
  ArrowRight,
} from 'lucide-react';

const EVENT_LABELS: Record<string, string> = {
  tab_hidden: '🚪 Ушёл со вкладки',
  tab_visible: '👁 Вернулся',
  window_blur: '💤 Окно неактивно',
  window_focus: '✅ Окно активно',
};

export default async function AdminHome() {
  const session = await auth();
  if (!session) redirect('/login');

  const totalUsers = await prisma.user.count();
  const totalActivity = await prisma.activity.count();
  const totalSubmissions = await prisma.submission.count();

  const activityToday = await prisma.activity.count({
    where: {
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const lastActivity = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { user: { select: { name: true } } },
  });

  const cards = [
    { label: 'Всего пользователей', value: totalUsers, icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Всего событий', value: totalActivity, icon: Activity, color: 'from-blue-500 to-cyan-500' },
    { label: 'Событий сегодня', value: activityToday, icon: Server, color: 'from-emerald-500 to-teal-500' },
    { label: 'Сдано работ', value: totalSubmissions, icon: FileText, color: 'from-orange-500 to-red-500' },
  ];

  const menu = [
    { href: '/teacher/admin/activity', label: 'Активность учеников', desc: 'Кто, когда и что делал', icon: Activity, color: 'text-blue-400' },
    { href: '/teacher/admin/compiler', label: 'Логи компилятора', desc: 'Запуски кода учениками', icon: Code2, color: 'text-purple-400' },
    { href: '/teacher/admin/submissions', label: 'Сданные работы', desc: 'Код и ответы на проверку', icon: FileText, color: 'text-emerald-400' },
    { href: '/teacher/admin/notifications', label: 'Уведомления', desc: 'Настройка Telegram-бота', icon: MessageSquare, color: 'text-orange-400' },
    { href: '/teacher/admin/settings', label: 'Настройки системы', desc: 'Безопасность и параметры', icon: Shield, color: 'text-red-400' },
  ];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Панель администратора</h1>
          <p className="text-slate-400 text-sm">Технический обзор платформы</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((s, i) => (
          <div key={i} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity`} />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${s.color} mb-3 shadow-lg`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-white mb-3">Разделы</h2>
          {menu.map((m, i) => (
            <Link
              key={i}
              href={m.href}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition group"
            >
              <div className={`p-2.5 rounded-xl bg-white/5 ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{m.label}</div>
                <div className="text-xs text-slate-500">{m.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
            </Link>
          ))}
        </div>

        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-white mb-4">Последняя активность</h2>
          {lastActivity.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">Событий пока нет</p>
          ) : (
            <div className="space-y-3">
              {lastActivity.map((a) => (
                <div key={a.id} className="text-xs">
                  <div className="text-slate-300 font-medium">{a.user.name}</div>
                  <div className="text-slate-500 flex items-center justify-between mt-0.5">
                    <span>{EVENT_LABELS[a.eventType] || a.eventType}</span>
                    <span>
                      {new Date(a.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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