import { prisma } from '@/lib/prisma';
import {
  Settings,
  Database,
  Server,
  Users,
  Activity,
  FileText,
  BookOpen,
  Code2,
  Shield,
  ClipboardList,
} from 'lucide-react';

export default async function SettingsPage() {
  const [users, students, teachers, notes, tests, activities, submissions, codeRuns, homeworks] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT', status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.note.count(),
      prisma.test.count(),
      prisma.activity.count(),
      prisma.submission.count(),
      prisma.codeRun.count(),
      prisma.homework.count(),
    ]);

  const stats = [
    { label: 'Пользователей', value: users, icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Учеников', value: students, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Учителей', value: teachers, icon: Shield, color: 'from-amber-500 to-orange-500' },
    { label: 'Конспектов', value: notes, icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { label: 'Тестов', value: tests, icon: FileText, color: 'from-orange-500 to-red-500' },
    { label: 'ДЗ', value: homeworks, icon: ClipboardList, color: 'from-blue-500 to-indigo-500' },
    { label: 'Событий активности', value: activities, icon: Activity, color: 'from-blue-500 to-indigo-500' },
    { label: 'Сданных тестов', value: submissions, icon: FileText, color: 'from-emerald-500 to-green-500' },
    { label: 'Запусков кода', value: codeRuns, icon: Code2, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Настройки системы</h1>
          <p className="text-slate-400 text-sm">Информация о платформе</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div
              className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.color} mb-2`}
            >
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">База данных</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Провайдер</span>
              <span className="text-white">Supabase (PostgreSQL)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ORM</span>
              <span className="text-white">Prisma 7.10.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Регион</span>
              <span className="text-white">eu-west-1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Режим</span>
              <span className="text-emerald-400">✅ Транзакционный пулер</span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Платформа</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Framework</span>
              <span className="text-white">Next.js 16.3.5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Runtime</span>
              <span className="text-white">Turbopack</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auth</span>
              <span className="text-white">NextAuth v5 (beta)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Хостинг</span>
              <span className="text-emerald-400">✅ Vercel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-200">
          🔒 <strong>Безопасность:</strong> все данные защищены, соединения через SSL,
          пароли хэшируются bcrypt. Сессии — JWT с TTL 24 часа.
        </p>
      </div>
    </div>
  );
}