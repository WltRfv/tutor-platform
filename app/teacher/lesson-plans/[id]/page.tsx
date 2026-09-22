import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookMarked,
  Eye,
  EyeOff,
  Clock,
  Edit,
} from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { DeleteLessonPlanButton } from '@/components/teacher/DeleteLessonPlanButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPlanViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: { subject: { select: { name: true } } },
  });

  if (!plan) notFound();

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/teacher/lesson-plans"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к методичкам
      </Link>

      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg flex-shrink-0">
          <BookMarked className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-2">{plan.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {plan.subject.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {plan.duration} мин
            </span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                plan.published
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {plan.published ? (
                <>
                  <Eye className="h-3 w-3" /> опубликована
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" /> черновик
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/teacher/lesson-plans/${plan.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition text-sm"
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Link>
          <DeleteLessonPlanButton id={plan.id} />
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <MathText className="text-slate-300 leading-relaxed">
          {plan.content}
        </MathText>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        👁 Методичку видят только учителя
      </p>
    </div>
  );
}