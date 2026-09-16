import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'ОГЭ',
  VPR_PREP: 'ВПР',
  INFORMATICS: 'Информатика',
};

export default async function TestsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const tests = user?.subjects.length
    ? await prisma.test.findMany({
        where: { published: true, subject: { in: user.subjects } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const submissions = await prisma.submission.findMany({
    where: { userId, testId: { not: null } },
  });

  const submittedIds = new Set(submissions.map((s) => s.testId));

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Тесты</h1>
        <p className="text-slate-400">Доступно тестов: {tests.length}</p>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          Пока нет доступных тестов
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const done = submittedIds.has(test.id);
            return (
              <Link key={test.id} href={`/student/tests/${test.id}`} className="block group">
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold truncate">{test.title}</h3>
                      {done && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                        {SUBJECT_LABELS[test.subject]}
                      </span>
                      {test.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {test.timeLimit} мин
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}