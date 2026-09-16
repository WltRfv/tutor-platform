import { prisma } from '@/lib/prisma';
import { Code2, CheckCircle2, XCircle } from 'lucide-react';

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  'c++': 'C++',
  java: 'Java',
  pascal: 'Pascal',
};

export default async function CompilerLogsPage() {
  const runs = await prisma.codeRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  const stats = {
    total: runs.length,
    success: runs.filter((r) => r.status === 'SUCCESS').length,
    errors: runs.filter((r) => r.status !== 'SUCCESS').length,
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <Code2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Логи компилятора</h1>
          <p className="text-slate-400 text-sm">Последние 100 запусков кода</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Всего</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Успешных</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.success}</div>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">С ошибками</div>
          <div className="text-2xl font-bold text-red-400">{stats.errors}</div>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <Code2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Запусков пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((r) => (
            <div
              key={r.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {r.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">{r.user.name}</div>
                    <div className="text-xs text-slate-500">{r.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-200 text-xs font-medium">
                    {LANGUAGE_LABELS[r.language] || r.language}
                  </span>
                  {r.status === 'SUCCESS' ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Успех
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs">
                      <XCircle className="h-3.5 w-3.5" /> Ошибка
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Код:</div>
                  <pre className="bg-slate-950/60 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto font-mono">
                    {r.code.slice(0, 500)}
                    {r.code.length > 500 ? '\n...' : ''}
                  </pre>
                </div>
                {(r.output || r.stderr) && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      {r.stderr ? 'Ошибка:' : 'Вывод:'}
                    </div>
                    <pre
                      className={`text-xs p-3 rounded-lg overflow-x-auto max-h-40 overflow-y-auto font-mono ${
                        r.stderr
                          ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {(r.stderr || r.output || '').slice(0, 500)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}