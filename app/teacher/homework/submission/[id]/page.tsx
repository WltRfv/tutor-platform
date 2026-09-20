import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SubmissionViewer } from '@/components/teacher/SubmissionViewer';

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, grade: true, email: true } },
      homework: {
        select: {
          id: true,
          title: true,
          description: true,
          subject: { select: { name: true } },
          tasks: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!submission) notFound();

  const allVersions = await prisma.homeworkSubmission.findMany({
    where: {
      homeworkId: submission.homeworkId,
      userId: submission.userId,
    },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      status: true,
      gradeEmoji: true,
      autoScore: true,
      autoTotal: true,
      createdAt: true,
      previewUrl: true,
    },
  });

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href={`/teacher/homework/${submission.homeworkId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> К заданию
      </Link>

      <SubmissionViewer
        submission={{
          id: submission.id,
          version: submission.version,
          status: submission.status,
          gradeEmoji: submission.gradeEmoji,
          teacherComment: submission.teacherComment,
          textAnswer: submission.textAnswer,
          previewUrl: submission.previewUrl,
          boardData: submission.boardData,
          taskCodes: submission.taskCodes as any,
          files: submission.files,
          taskAnswers: submission.taskAnswers as any,
          autoScore: submission.autoScore,
          autoTotal: submission.autoTotal,
          createdAt: submission.createdAt.toISOString(),
          user: submission.user,
          aiReview: submission.aiReview,
          aiReviewScore: submission.aiReviewScore,
          aiReviewedAt: submission.aiReviewedAt?.toISOString() || null,
          homework: {
            id: submission.homework.id,
            title: submission.homework.title,
            description: submission.homework.description,
            subjectName: submission.homework.subject.name,
            tasks: submission.homework.tasks.map((t) => ({
              id: t.id,
              order: t.order,
              text: t.text,
              imageUrl: t.imageUrl,
              hasAutoCheck: !!t.correctAnswer,
              answerType: t.answerType,
              points: t.points,
            })),
          },
        }}
        allVersions={allVersions.map((v) => ({
          id: v.id,
          version: v.version,
          status: v.status,
          gradeEmoji: v.gradeEmoji,
          autoScore: v.autoScore,
          autoTotal: v.autoTotal,
          createdAt: v.createdAt.toISOString(),
          previewUrl: v.previewUrl,
        }))}
      />
    </div>
  );
}