import { prisma } from '@/lib/prisma';
import { QuestionsList } from '@/components/teacher/QuestionsList';

export default async function QuestionsPage() {
  const subjects = await prisma.subjects.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, category: true, grade: true },
  });

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { id: true, name: true } } },
    take: 500,
  });

  return (
    <div className="p-8 max-w-6xl">
      <QuestionsList
        subjects={subjects}
        initialQuestions={questions.map((q) => ({
          id: q.id,
          subjectId: q.subjectId,
          subjectName: q.subject.name,
          topic: q.topic,
          difficulty: q.difficulty,
          type: q.type,
          text: q.text,
          imageUrl: q.imageUrl,
          options: q.options,
          correct: q.correct,
          correctMulti: q.correctMulti,
          correctText: q.correctText,
          matchMode: q.matchMode,
          correctNumber: q.correctNumber,
          tolerance: q.tolerance,
          correctBool: q.correctBool,
          explanation: q.explanation,
          points: q.points,
          source: q.source,
          createdAt: q.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}