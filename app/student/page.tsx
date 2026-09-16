import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, FileText, Code2, Calendar, ArrowRight, Clock } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'Подготовка к ОГЭ',
  VPR_PREP: 'Подготовка к ВПР',
  INFORMATICS: 'Информатика',
};

export default async function StudentHome() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const codeRunsCount = await prisma.codeRun.count({ where: { userId } });

  const recentRuns = await prisma.codeRun.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const subjects = user?.subjects || [];

  const myNotesCount = subjects.length
    ? await prisma.note.count({
        where: { published: true, subject: { in: subjects } },
      })
    : 0;

  const myTestsCount = subjects.length
    ? await prisma.test.count({
        where: { published: true, subject: { in: subjects } },
      })
    : 0;

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Привет, {session.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400">
          {user?.grade ? `${user.grade} класс · ` : ''}
          Твои предметы:{' '}
          {subjects.length
            ? subjects.map((s) => SUBJECT_LABELS[s]).join(', ')
            : 'не выбраны'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/student/notes">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
              <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-3 shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{myNotesCount}</div>
              <div className="text-xs text-slate-400">конспектов</div>
            </div>
          </div>
        </Link>

        <Link href="/student/tests">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
              <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-3 shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{myTestsCount}</div>
              <div className="text-xs text-slate-400">тестов доступно</div>
            </div>
          </div>
        </Link>

        <Link href="/student/compiler">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
              <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 mb-3 shadow-lg">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{codeRunsCount}</div>
              <div className="text-xs text-slate-400">запусков кода</div>
            </div>
          </div>
        </Link>

        <Link href="/student/calendar">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
              <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 mb-3 shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm font-bold text-white mb-1">Расписание</div>
              <div className="text-xs text-slate-400">занятий</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Последние запуски кода</h2>
          {recentRuns.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              Пока нет запусков. Попробуй компилятор!
            </p>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <Code2 className="h-4 w-4 text-purple-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{r.language}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {r.code.slice(0, 60)}...
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Быстрые действия</h2>
          <div className="space-y-2">
            {[
              { href: '/student/notes', label: 'Открыть конспекты', icon: BookOpen, color: 'text-emerald-400' },
              { href: '/student/tests', label: 'Пройти тест', icon: FileText, color: 'text-blue-400' },
              { href: '/student/compiler', label: 'Запустить код', icon: Code2, color: 'text-purple-400' },
            ].map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition group"
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