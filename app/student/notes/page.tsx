import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BookOpen } from 'lucide-react';
import { NotesList } from '@/components/student/NotesList';
import { StudentSubjectTabs } from '@/components/student/StudentSubjectTabs';

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = (session.user as any).id;
  const { subject: subjectParam } = await searchParams;

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId },
    include: {
      subject: { select: { id: true, name: true, category: true } },
    },
    orderBy: { subject: { order: 'asc' } },
  });

  const subjectIds = userSubjects.map((us) => us.subjectId);

  if (subjectIds.length === 0) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-1">Все конспекты</h1>
        <p className="text-slate-400 mb-6">У тебя пока нет предметов</p>
      </div>
    );
  }

  let currentSubjectId: string | null = null;
  if (subjectParam && subjectIds.includes(subjectParam)) {
    currentSubjectId = subjectParam;
  } else if (subjectIds.length === 1) {
    currentSubjectId = subjectIds[0];
  }

  const unlocks = await prisma.topicUnlock.findMany({
    where: { userId },
    select: { topicId: true },
  });
  const unlockedTopicIds = unlocks.map((u) => u.topicId);

  // Если предмет не выбран и есть несколько
  if (!currentSubjectId) {
    const allNotes = await prisma.note.findMany({
      where: {
        published: true,
        subjectId: { in: subjectIds },
        OR: [{ topicId: null }, { topicId: { in: unlockedTopicIds } }],
      },
      select: { subjectId: true },
    });

    const counts: Record<string, number> = {};
    allNotes.forEach((n) => {
      counts[n.subjectId] = (counts[n.subjectId] || 0) + 1;
    });

    return (
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Все конспекты</h1>
          <p className="text-slate-400 text-sm">
            Выбери предмет, чтобы посмотреть материалы
          </p>
        </div>
        <StudentSubjectTabs
          basePath="/student/notes"
          subjects={userSubjects.map((us) => ({
            id: us.subject.id,
            name: us.subject.name,
            category: us.subject.category,
            count: counts[us.subject.id] || 0,
          }))}
          currentSubjectId={null}
        />
      </div>
    );
  }

  // Материалы по выбранному предмету
  const notes = await prisma.note.findMany({
    where: {
      published: true,
      subjectId: currentSubjectId,
      OR: [{ topicId: null }, { topicId: { in: unlockedTopicIds } }],
    },
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { name: true } } },
  });

  const currentSubject = userSubjects.find(
    (us) => us.subjectId === currentSubjectId
  )?.subject;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          {currentSubject?.name || 'Конспекты'}
        </h1>
        <p className="text-slate-400 text-sm">
          Доступно материалов: {notes.length}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Материалы с закрытых тем появятся здесь, когда учитель их откроет
        </p>
      </div>

      <StudentSubjectTabs
        basePath="/student/notes"
        subjects={userSubjects.map((us) => ({
          id: us.subject.id,
          name: us.subject.name,
          category: us.subject.category,
        }))}
        currentSubjectId={currentSubjectId}
      />

      {notes.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет доступных конспектов по этому предмету</p>
        </div>
      ) : (
        <NotesList
          notes={notes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            subject: n.subjectId,
            subjectName: n.subject.name,
            topic: n.topicName,
            createdAt: n.createdAt,
          }))}
        />
      )}
    </div>
  );
}