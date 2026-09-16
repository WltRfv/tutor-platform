import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  Calendar,
  Edit,
} from 'lucide-react';
import { DeleteTestButton } from '@/components/teacher/DeleteTestButton';

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'ОГЭ',
  VPR_PREP: 'ВПР',
  INFORMATICS: 'Информатика',
};

type Question = {
  id: string;
  text: string;
  options: string[];
  correct: number;
};

export default async function TestViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await prisma.test.findUnique({ where: { id } });

  if (!test) notFound();

  const questions = test.questions as unknown as Question[];

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/teacher/content"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к контенту
      </Link>

      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20 flex-shrink-0">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {SUBJECT_LABELS[test.subject]}
            </span>
            {test.timeLimit && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {test.timeLimit} мин
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(test.createdAt).toLocaleDateString('ru-RU')}
            </span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${
                test.published
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {test.published ? (
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
            href={`/teacher/content/tests/${test.id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition text-sm"
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Link>
          <DeleteTestButton id={test.id} />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="text-white font-medium mb-4">
              {i + 1}. {q.text}
            </div>
            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const isCorrect = idx === q.correct;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                      isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${
                        isCorrect
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{opt}</span>
                    {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        ✅ Правильные ответы подсвечены зелёным — ученики их не видят
      </p>
    </div>
  );
}