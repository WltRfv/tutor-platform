import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { HomeworkView } from '@/components/student/HomeworkView';

export default async function StudentHomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const userId = (session.user as any).id;

  const homework = await prisma.homework.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true } },
      subject: { select: { name: true } },
      tasks: { orderBy: { order: 'asc' } },
      submissions: {
        where: { userId },
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!homework) notFound();

  return (
    <HomeworkView
      homework={{
        id: homework.id,
        title: homework.title,
        description: homework.description,
        subject: homework.subjectId,
        subjectName: homework.subject.name,
        imageUrl: homework.imageUrl,
        dueDate: homework.dueDate?.toISOString() || null,
        teacherName: homework.teacher.name,
        tasks: homework.tasks.map((t) => ({
          id: t.id,
          order: t.order,
          text: t.text,
          imageUrl: t.imageUrl,
          hasAutoCheck: !!t.correctAnswer,
          answerType: t.answerType,
          points: t.points,
        })),
      }}
      lastSubmission={
        homework.submissions[0]
          ? {
              id: homework.submissions[0].id,
              version: homework.submissions[0].version,
              status: homework.submissions[0].status,
              teacherComment: homework.submissions[0].teacherComment,
              gradeEmoji: homework.submissions[0].gradeEmoji,
              textAnswer: homework.submissions[0].textAnswer,
              files: homework.submissions[0].files as any,
              previewUrl: homework.submissions[0].previewUrl,
              taskAnswers: homework.submissions[0].taskAnswers as any,
              autoScore: homework.submissions[0].autoScore,
              autoTotal: homework.submissions[0].autoTotal,
            }
          : null
      }
      historyCount={homework.submissions.length}
    />
  );
}