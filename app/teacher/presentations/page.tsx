import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Presentation as PresentationIcon, Plus, Eye, EyeOff, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PresentationsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const items = await prisma.presentation.findMany({
    where: { authorId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    include: {
      subject: { select: { name: true } },
      _count: { select: { slides: true } },
    },
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
            <PresentationIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Презентации</h1>
            <p className="text-slate-400 text-sm">
              Слайды для уроков — показываются ученику
            </p>
          </div>
        </div>

        <Link
          href="/teacher/presentations/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
        >
          <Plus className="h-4 w-4" />
          Создать презентацию
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <PresentationIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет презентаций</p>
          <Link
            href="/teacher/presentations/new"
            className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Создать первую →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/teacher/presentations/${p.id}`}
              className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-purple-500/40 transition"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg flex-shrink-0">
                  <PresentationIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{p.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                      {p.subject.name}
                    </span>
                    {p.topicName && (
                      <span className="text-xs text-slate-400 truncate">
                        {p.topicName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {p._count.slides} слайдов
                </span>
                {p.published ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Eye className="h-3 w-3" /> опубликована
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" /> черновик
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}