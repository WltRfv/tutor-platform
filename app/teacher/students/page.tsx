import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  GraduationCap,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      grade: true,
      phone: true,
      userSubjects: {
        select: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });

  const withStats = await Promise.all(
    students.map(async (s) => {
      const activityCount = await prisma.activity.count({ where: { userId: s.id } });
      const submissions = await prisma.submission.findMany({
        where: { userId: s.id },
        select: { score: true },
      });
      const avgScore =
        submissions.length > 0
          ? Math.round(
              submissions.reduce((sum, x) => sum + (x.score || 0), 0) / submissions.length
            )
          : null;
      return {
        ...s,
        subjects: s.userSubjects.map((us) => us.subject),
        activityCount,
        submissionsCount: submissions.length,
        avgScore,
      };
    })
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Ученики</h1>
        <p className="text-slate-400">Активных: {students.length}</p>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет одобренных учеников</p>
          <Link
            href="/teacher/applications"
            className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Перейти к заявкам →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {withStats.map((s) => (
            <Link
              key={s.id}
              href={`/teacher/students/${s.id}`}
              className="relative group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{s.name}</h3>
                  {s.grade && (
                    <p className="text-xs text-slate-400 mt-0.5">{s.grade} класс</p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition flex-shrink-0" />
              </div>

              <div className="space-y-2 text-xs text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="truncate">{s.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {s.subjects.length === 0 ? (
                  <span className="text-xs text-slate-500">Нет предметов</span>
                ) : (
                  s.subjects.map((sub) => (
                    <span
                      key={sub.id}
                      className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 text-xs"
                    >
                      {sub.name}
                    </span>
                  ))
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                <div>
                  <div className="text-lg font-bold text-white">{s.activityCount}</div>
                  <div className="text-xs text-slate-500">событий</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{s.submissionsCount}</div>
                  <div className="text-xs text-slate-500">тестов</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-400">
                    {s.avgScore !== null ? `${s.avgScore}%` : '—'}
                  </div>
                  <div className="text-xs text-slate-500">средний</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}