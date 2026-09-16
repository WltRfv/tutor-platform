import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MessengerLinkEditor } from '@/components/teacher/MessengerLinkEditor';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Activity,
  FileText,
  Code2,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Link2,
} from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'ОГЭ',
  VPR_PREP: 'ВПР',
  INFORMATICS: 'Информатика',
};

const EVENT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  tab_hidden: { label: 'Ушёл со вкладки', color: 'text-red-400', emoji: '🚪' },
  tab_visible: { label: 'Вернулся', color: 'text-emerald-400', emoji: '👁' },
  window_blur: { label: 'Окно неактивно', color: 'text-orange-400', emoji: '💤' },
  window_focus: { label: 'Окно активно', color: 'text-blue-400', emoji: '✅' },
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== 'STUDENT') notFound();

  const activities = await prisma.activity.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const submissions = await prisma.submission.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { test: { select: { title: true, subject: true } } },
  });

  const codeRuns = await prisma.codeRun.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
        )
      : null;

  const tabHiddenCount = activities.filter((a) => a.eventType === 'tab_hidden').length;

  return (
    <div className="p-8 max-w-6xl">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к ученикам
      </Link>

      {/* Профиль */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 mb-6">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-purple-500/30 flex-shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-3xl font-bold text-white mb-2">{student.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {student.grade && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> {student.grade} класс
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {student.email}
              </span>
              {student.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" /> {student.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                с {new Date(student.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {student.subjects.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-200 text-xs font-medium"
                >
                  {SUBJECT_LABELS[s] || s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    {/* Ссылка на чат */}
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0">
                <Link2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
            <h2 className="text-sm font-semibold text-white mb-2">Быстрая связь</h2>
            <MessengerLinkEditor
                studentId={student.id}
                initialLink={(student as any).messengerLink}
            />
            </div>
        </div>
    </div>
      {/* Метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-3">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{activities.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">событий активности</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 mb-3">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="text-2xl font-bold text-white">{submissions.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">сдано тестов</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-3">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">средний балл</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 mb-3">
            <XCircle className="h-4 w-4 text-white" />
          </div>
          <div className="text-2xl font-bold text-red-400">{tabHiddenCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">ушёл со вкладки</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Сданные тесты */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Сданные тесты
          </h2>
          {submissions.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">Ещё не сдавал</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => {
                const score = s.score ?? 0;
                const color =
                  score >= 80
                    ? 'text-emerald-400'
                    : score >= 50
                    ? 'text-yellow-400'
                    : 'text-red-400';
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {s.test?.title || 'Задание'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${color}`}>{score}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Запуски кода */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-purple-400" />
            Запуски кода
          </h2>
          {codeRuns.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">Ещё не запускал</p>
          ) : (
            <div className="space-y-2">
              {codeRuns.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <Code2 className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{r.language}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {r.code.slice(0, 40)}...
                    </div>
                  </div>
                  {r.status === 'SUCCESS' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Активность */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          Последняя активность
        </h2>
        {activities.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">Событий пока нет</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {activities.map((a) => {
              const ev = EVENT_LABELS[a.eventType] || {
                label: a.eventType,
                color: 'text-slate-400',
                emoji: '•',
              };
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 text-sm"
                >
                  <div className={`flex items-center gap-2 ${ev.color}`}>
                    <span>{ev.emoji}</span>
                    <span>{ev.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}