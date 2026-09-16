import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileText, CheckCircle2, Award } from 'lucide-react';

export default async function SubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, email: true, grade: true } },
      test: { select: { title: true, subject: true } },
    },
  });

  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
        )
      : 0;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Сданные работы</h1>
          <p className="text-slate-400 text-sm">
            Всего: {submissions.length} · Средний балл: {avgScore}%
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Ученики ещё не сдавали тесты</p>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 text-xs text-slate-500 font-medium">
            <div className="col-span-3">Ученик</div>
            <div className="col-span-4">Тест</div>
            <div className="col-span-2">Класс</div>
            <div className="col-span-1 text-center">Балл</div>
            <div className="col-span-2 text-right">Дата</div>
          </div>
          <div className="divide-y divide-white/5">
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
                  className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-white/5 transition text-sm items-center"
                >
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {s.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-200 truncate">{s.user.name}</span>
                  </div>
                  <div className="col-span-4 text-slate-300 truncate">
                    {s.test?.title || <span className="text-slate-500">Задание</span>}
                  </div>
                  <div className="col-span-2 text-slate-400">
                    {s.user.grade ? `${s.user.grade} кл.` : '—'}
                  </div>
                  <div className={`col-span-1 text-center font-semibold ${color}`}>
                    {score}%
                  </div>
                  <div className="col-span-2 text-right text-slate-500 text-xs">
                    {new Date(s.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}