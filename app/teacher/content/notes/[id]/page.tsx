import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  Calendar,
  Edit,
  Users,
} from 'lucide-react';
import { DeleteNoteButton } from '@/components/teacher/DeleteNoteButton';
import { NoteTabs } from '@/components/shared/NoteTabs';
import { SelfWorkReview } from '@/components/teacher/SelfWorkReview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!note) notFound();

  // Ученики, которым доступен этот конспект
  let eligible: { id: string; name: string; email: string }[] = [];

  if (note.topicId) {
    const unlocks = await prisma.topicUnlock.findMany({
      where: { topicId: note.topicId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    eligible = unlocks
      .filter((u) => {
        if (u.user.role !== 'STUDENT') return false;
        const raw = (u.contentIds as unknown) as string[] | null | undefined;
        if (raw === null || raw === undefined) return true;
        if (!Array.isArray(raw)) return true;
        return raw.includes(`note:${id}`);
      })
      .map((u) => u.user);
  }

  const statuses = await prisma.selfWorkStatus.findMany({
    where: { noteId: id },
  });
  const statusMap = new Map(statuses.map((s) => [s.userId, s]));

  const selfWorkPanel =
    eligible.length > 0 ? (
      <SelfWorkReview
        noteId={id}
        students={eligible.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          status: statusMap.get(s.id)?.status || 'PENDING',
          studentAnswer: statusMap.get(s.id)?.studentAnswer || null,
          teacherComment: statusMap.get(s.id)?.teacherComment || null,
        }))}
      />
    ) : note.topicId ? (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <Users className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-40" />
        <p className="text-sm text-slate-400">
          Ни один ученик ещё не получил доступ к этой теме
        </p>
      </div>
    ) : (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-400">
          Привяжи конспект к теме, чтобы отслеживать зачёты учеников
        </p>
      </div>
    );

  // Если у конспекта привязана презентация — готовим для NoteTabs
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
        href="/teacher/content"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к контенту
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
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                note.published
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {note.published ? (
                <>
                  <Eye className="h-3 w-3" /> Опубликован
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
            href={`/teacher/content/notes/${note.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition text-sm"
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Link>
          <DeleteNoteButton id={note.id} />
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

      <p className="text-xs text-slate-500 mt-6 text-center">
        👁 Так этот конспект видят ученики
      </p>
    </div>
  );
}