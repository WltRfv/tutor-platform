import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Code2,
  Calendar,
  ArrowRight,
  Clock,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

export default async function StudentHome() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId },
    include: { subject: { select: { name: true, id: true } } },
  });

  const subjectIds = userSubjects.map((us) => us.subjectId);
  const subjectNames = userSubjects.map((us) => us.subject.name);

  const codeRunsCount = await prisma.codeRun.count({ where: { userId } });

  const recentRuns = await prisma.codeRun.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const myNotesCount = subjectIds.length
    ? await prisma.note.count({
        where: { published: true, subjectId: { in: subjectIds } },
      })
    : 0;

  const myTestsCount = subjectIds.length
    ? await prisma.test.count({
        where: { published: true, subjectId: { in: subjectIds } },
      })
    : 0;

  // НЕВЫПОЛНЕННЫЕ ДЗ
  const allHomeworks = subjectIds.length
    ? await prisma.homework.findMany({
        where: {
          OR: [
            { targetType: 'ALL', subjectId: { in: subjectIds } },
            { targetType: 'SPECIFIC', targetUserId: userId },
          ],
        },
        include: {
          submissions: {
            where: { userId },
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      })
    : [];

  const incompleteHW = allHomeworks.filter((hw) => hw.submissions.length === 0);
  const needsRevisionHW = allHomeworks.filter(
    (hw) => hw.submissions[0]?.status === 'NEEDS_REVISION'
  );

  // Средний балл по тестам
  const submissions = await prisma.submission.findMany({
    where: { userId },
    select: { score: true },
  });
  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
        )
      : null;

  // Смайлики от учителя за последние 5 сдач ДЗ
  const recentReviews = await prisma.homeworkSubmission.findMany({
    where: {
      userId,
      gradeEmoji: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      homework: { select: { title: true, id: true } },
    },
  });

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          Привет, {session.user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-400">
          {user?.grade ? `${user.grade} класс · ` : ''}
          Твои предметы: {subjectNames.length ? subjectNames.join(', ') : 'не выбраны'}
        </p>
      </div>

      {/* Красная плашка: невыполненные ДЗ */}
      {(incompleteHW.length > 0 || needsRevisionHW.length > 0) && (
        <Link href="/student/homework" className="block mb-4 group">
          <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-5 hover:border-red-500/50 transition flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-lg">
                {incompleteHW.length > 0 && (
                  <>
                    {incompleteHW.length} {incompleteHW.length === 1 ? 'задание' : 'заданий'} не сдано
                  </>
                )}
                {incompleteHW.length > 0 && needsRevisionHW.length > 0 && ' · '}
                {needsRevisionHW.length > 0 && (
                  <>
                    {needsRevisionHW.length} на доработку
                  </>
                )}
              </div>
              <div className="text-sm text-red-300">
                Открой список заданий и всё исправь
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-red-400 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      )}

      {/* Смайлики от учителя */}
      {recentReviews.length > 0 && (
        <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              Оценки за последние ДЗ
            </span>
          </div>
          <div className="space-y-2">
            {recentReviews.map((r) => (
              <Link
                key={r.id}
                href={`/student/homework/${r.homework.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition"
              >
                <span className="text-2xl leading-none">{r.gradeEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {r.homework.title}
                  </div>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-500" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4 карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/student/homework">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
              <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 mb-3 shadow-lg">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {allHomeworks.length}
              </div>
              <div className="text-xs text-slate-400">домашних заданий</div>
            </div>
          </div>
        </Link>

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
      </div>

      {/* Прогресс */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Диаграмма среднего балла */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Твой прогресс
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeDasharray={`${avgScore || 0} 100`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {avgScore !== null ? `${avgScore}%` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500">средний</div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Сдано тестов</span>
                  <span className="text-white font-medium">{submissions.length}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{
                      width: `${Math.min((submissions.length / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Запусков кода</span>
                  <span className="text-white font-medium">{codeRunsCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min((codeRunsCount / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">ДЗ выполнено</span>
                  <span className="text-white font-medium">
                    {allHomeworks.length - incompleteHW.length} из {allHomeworks.length}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{
                      width: `${
                        allHomeworks.length > 0
                          ? ((allHomeworks.length - incompleteHW.length) /
                              allHomeworks.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Последние запуски кода */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Последние запуски кода
          </h2>
          {recentRuns.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              Попробуй компилятор!
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
                      {r.code.slice(0, 40)}...
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            href: '/student/calendar',
            label: 'Расписание занятий',
            icon: Calendar,
            color: 'text-orange-400',
          },
          {
            href: '/student/notes',
            label: 'Открыть конспекты',
            icon: BookOpen,
            color: 'text-emerald-400',
          },
          {
            href: '/student/compiler',
            label: 'Запустить код',
            icon: Code2,
            color: 'text-purple-400',
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