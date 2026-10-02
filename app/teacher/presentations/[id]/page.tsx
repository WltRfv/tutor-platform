import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';
import { DeletePresentationButton } from '@/components/teacher/DeletePresentationButton';
import { SlideViewer } from '@/components/shared/SlideViewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PresentationViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const p = await prisma.presentation.findFirst({
    where: { id, authorId: (session.user as any).id },
    include: {
      subject: { select: { name: true } },
      slides: { orderBy: { order: 'asc' } },
    },
  });
  if (!p) notFound();

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/teacher/presentations"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К презентациям
      </Link>

      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-2">{p.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {p.subject.name}
            </span>
            {p.topicName && <span>· {p.topicName}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(p.createdAt).toLocaleDateString('ru-RU')}
            </span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                p.published
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {p.published ? (
                <>
                  <Eye className="h-3 w-3" /> Опубликована
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" /> Черновик
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/teacher/presentations/${p.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition text-sm"
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Link>
          <DeletePresentationButton id={p.id} />
        </div>
      </div>

      {p.slides.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <p>Пока нет слайдов</p>
        </div>
      ) : (
        <SlideViewer
          presentationTitle={p.title}
          slides={p.slides.map((s) => ({
            id: s.id,
            title: s.title || '',
            content: s.content,
            imageUrl: s.imageUrl || '',
          }))}
        />
      )}
    </div>
  );
}