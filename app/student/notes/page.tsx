import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BookOpen } from 'lucide-react';
import { NotesList } from '@/components/student/NotesList';

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'ОГЭ',
  VPR_PREP: 'ВПР',
  INFORMATICS: 'Информатика',
};

export default async function NotesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
  });

  const notes = user?.subjects.length
    ? await prisma.note.findMany({
        where: { published: true, subject: { in: user.subjects } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Конспекты</h1>
        <p className="text-slate-400">
          Материалы по твоим предметам: {notes.length} доступно
        </p>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          Пока нет доступных конспектов
        </div>
      ) : (
        <NotesList notes={notes as any} subjectLabels={SUBJECT_LABELS} />
      )}
    </div>
  );
}