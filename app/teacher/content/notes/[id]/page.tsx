import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Eye, EyeOff, Calendar, Trash2 } from 'lucide-react';
import { DeleteNoteButton } from '@/components/teacher/DeleteNoteButton';
import { Edit } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'ОГЭ',
  VPR_PREP: 'ВПР',
  INFORMATICS: 'Информатика',
};

export default async function NoteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });

  if (!note) notFound();

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/teacher/content"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к контенту
      </Link>

      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 flex-shrink-0">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-2">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {SUBJECT_LABELS[note.subject]}
            </span>
            {note.topic && <span>· {note.topic}</span>}
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

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        👁 Так этот конспект видят ученики с этим предметом
      </p>
    </div>
  );
}