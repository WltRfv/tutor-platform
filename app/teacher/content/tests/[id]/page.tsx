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
  Repeat,
  Wand2,
  PenSquare,
} from 'lucide-react';
import { DeleteTestButton } from '@/components/teacher/DeleteTestButton';
import { MathText } from '@/components/shared/MathText';

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  TEXT: 'Текст',
  NUMBER: 'Число',
  TRUE_FALSE: 'Правда/Ложь',
};

export default async function TestViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: { subject: { select: { name: true } } },
  });

  if (!test) notFound();

  const questions = (test.questions as any[]) || [];

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/teacher/content"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к контенту
      </Link>

      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg flex-shrink-0">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {test.subject.name}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 flex items-center gap-1">
              {test.mode === 'BANK_CUSTOM' ? (
                <>
                  <Wand2 className="h-3 w-3" /> Из банка
                </>
              ) : (
                <>
                  <PenSquare className="h-3 w-3" /> Вручную
                </>
              )}
            </span>
            {test.timeLimit && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {test.timeLimit} мин
              </span>
            )}
            <span className="flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5" /> Попыток: {test.attemptsAllowed}
            </span>
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

      <div className="text-sm text-slate-400 mb-4">
        Вопросов: {questions.length}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Вопросы не заданы</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id || i}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-white font-medium">{i + 1}.</span>
                <div className="flex-1">
                  <MathText className="text-white font-medium">{q.text}</MathText>
                  <div className="text-xs text-slate-500 mt-1">
                    • {TYPE_LABELS[q.type] || q.type}
                    {q.points && ` · ${q.points} балл(ов)`}
                  </div>
                </div>
              </div>

              {q.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-slate-950/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              )}

              {/* SINGLE */}
              {q.type === 'SINGLE_CHOICE' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt: string, idx: number) => {
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
                        <MathText className="flex-1">{opt}</MathText>
                        {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MULTI */}
              {q.type === 'MULTI_CHOICE' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt: string, idx: number) => {
                    const isCorrect = (q.correctMulti || []).includes(idx);
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
                          className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 text-xs ${
                            isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-white/20'
                          }`}
                        >
                          {isCorrect && '✓'}
                        </div>
                        <MathText className="flex-1">{opt}</MathText>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TEXT */}
              {q.type === 'TEXT' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300 mb-1">
                    Правильный ответ:
                  </div>
                  <div className="text-sm text-emerald-200 font-medium">
                    {q.correctText}
                  </div>
                  {q.matchMode === 'CONTAINS' && (
                    <div className="text-[10px] text-emerald-300/70 mt-1">
                      (засчитывается если содержит это)
                    </div>
                  )}
                </div>
              )}

              {/* NUMBER */}
              {q.type === 'NUMBER' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300 mb-1">
                    Правильное число:
                  </div>
                  <div className="text-sm text-emerald-200 font-medium">
                    {q.correctNumber}
                    {q.tolerance && (
                      <span className="text-xs text-emerald-300/70 ml-2">
                        (± {q.tolerance})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* TRUE_FALSE */}
              {q.type === 'TRUE_FALSE' && (
                <div
                  className={`p-3 rounded-xl border ${
                    q.correctBool
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-1">
                    Правильный ответ:
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      q.correctBool ? 'text-emerald-200' : 'text-red-200'
                    }`}
                  >
                    {q.correctBool ? '✓ Правда' : '✗ Ложь'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-6 text-center">
        ✅ Правильные ответы подсвечены — ученики их не видят
      </p>
    </div>
  );
}