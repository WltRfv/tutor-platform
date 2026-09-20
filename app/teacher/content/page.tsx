import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BookOpen, FileText, Plus, ArrowRight, Eye } from 'lucide-react';

export default async function ContentPage() {
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { subject: { select: { name: true } } },
  });

  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { subject: { select: { name: true } } },
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Конспекты и тесты</h1>
        <p className="text-slate-400">
          Создавай материалы и просматривай их как ученик
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Конспекты */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Конспекты</h2>
              <span className="text-xs text-slate-500">({notes.length})</span>
            </div>
            <Link
              href="/teacher/content/notes/new"
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition"
            >
              <Plus className="h-4 w-4" /> Создать
            </Link>
          </div>

          {notes.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              Пока нет конспектов. Создай первый!
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <Link key={n.id} href={`/teacher/content/notes/${n.id}`}>
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{n.title}</div>
                      <div className="text-xs text-slate-500">
                        {n.subject.name}{' '}
                        {n.published ? '· ✅ опубликован' : '· черновик'}
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Тесты */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Тесты</h2>
              <span className="text-xs text-slate-500">({tests.length})</span>
            </div>
            <Link
              href="/teacher/content/tests/new"
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition"
            >
              <Plus className="h-4 w-4" /> Создать
            </Link>
          </div>

          {tests.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              Пока нет тестов. Создай первый!
            </p>
          ) : (
            <div className="space-y-2">
              {tests.map((t) => (
                <Link key={t.id} href={`/teacher/content/tests/${t.id}`}>
                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{t.title}</div>
                      <div className="text-xs text-slate-500">
                        {t.subject.name}{' '}
                        {t.published ? '· ✅ опубликован' : '· черновик'}
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}