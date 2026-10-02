import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { SlideViewer } from '@/components/shared/SlideViewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const { id } = await params;

  const p = await prisma.presentation.findUnique({
    where: { id },
    include: { subject: { select: { name: true } }, slides: { orderBy: { order: 'asc' } } },
  });
  if (!p || !p.published) notFound();

  const userSub = await prisma.userSubject.findFirst({
    where: { userId, subjectId: p.subjectId },
  });
  if (!userSub) notFound();

  if (p.topicId) {
    const unlock = await prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: p.topicId, userId } },
    });
    if (!unlock) notFound();
    const raw = (unlock.contentIds as unknown) as string[] | null | undefined;
    if (Array.isArray(raw) && !raw.includes(`presentation:${id}`)) notFound();
  }

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/student/topics"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К темам
      </Link>

      <div className="mb-6">
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
        </div>
      </div>

      <SlideViewer
        presentationTitle={p.title}
        slides={p.slides.map((s) => ({
          id: s.id,
          title: s.title || '',
          content: s.content,
          imageUrl: s.imageUrl || '',
        }))}
      />
    </div>
  );
}