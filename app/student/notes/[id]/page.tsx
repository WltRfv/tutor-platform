import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react';
import { NoteTabs } from '@/components/shared/NoteTabs';
import { StudentSelfWorkPanel } from '@/components/student/StudentSelfWorkPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true } },
      presentation: {
        include: { slides: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!note || !note.published) notFound();

  const userSub = await prisma.userSubject.findFirst({
    where: { userId, subjectId: note.subjectId },
  });
  if (!userSub) notFound();

  if (note.topicId) {
    const unlock = await prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: note.topicId, userId } },
    });
    if (!unlock) notFound();
    const raw = (unlock.contentIds as unknown) as string[] | null | undefined;
    if (Array.isArray(raw) && !raw.includes(`note:${id}`)) notFound();
  }

  const status = await prisma.selfWorkStatus.findUnique({
    where: { noteId_userId: { noteId: id, userId } },
  });

  const selfWorkPanel =
    note.selfWorkContent?.trim() ? (
      <StudentSelfWorkPanel
        noteId={id}
        initialStatus={status?.status || 'PENDING'}
        initialAnswer={status?.studentAnswer || ''}
        teacherComment={status?.teacherComment || null}
      />
    ) : null;

  const presentation = note.presentation
    ? {
        title: note.presentation.title,
        slides: note.presentation.slides.map((s) => ({
          id: s.id,
          title: s.title || '',
          content: s.content,
          imageUrl: s.imageUrl || '',
        })),
      }
    : undefined;

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/student/notes"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> К конспектам
      </Link>

      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg flex-shrink-0">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-2">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {note.subject.name}
            </span>
            {note.topicName && <span>· {note.topicName}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(note.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>

      {note.imageUrl && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.imageUrl}
            alt={note.title}
            className="w-full h-auto max-h-[400px] object-cover"
          />
        </div>
      )}

      <NoteTabs
        theory={note.content}
        practice={note.practiceContent}
        selfWork={note.selfWorkContent}
        selfWorkExtra={selfWorkPanel}
        presentation={presentation}
      />
    </div>
  );
}