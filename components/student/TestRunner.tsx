'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  CheckSquare,
  AlignLeft,
  Hash,
  ToggleLeft,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { MathText } from '@/components/shared/MathText';
import { cn } from '@/lib/utils';

type AnswerValue = number | number[] | string | boolean | null;

export function TestRunner({
  test,
}: {
  test: { id: string; title: string; timeLimit: number | null; questions: any[] };
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    test.timeLimit ? test.timeLimit * 60 : null
  );
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const questions = test.questions;

  const setAnswer = (qId: string, value: AnswerValue) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const toggleMulti = (qId: string, idx: number) => {
    if (submitted) return;
    const prev = (answers[qId] as number[]) || [];
    const next = prev.includes(idx)
      ? prev.filter((i) => i !== idx)
      : [...prev, idx].sort((a, b) => a - b);
    setAnswers((p) => ({ ...p, [qId]: next }));
  };

  const checkAnswer = (q: any, ans: AnswerValue): boolean => {
    if (ans === null || ans === undefined) return false;
    if (q.type === 'SINGLE_CHOICE') return ans === q.correct;
    if (q.type === 'MULTI_CHOICE') {
      const arr = (ans as number[]) || [];
      const correct = (q.correctMulti || []).slice().sort((a: number, b: number) => a - b);
      return arr.length === correct.length && arr.every((v, i) => v === correct[i]);
    }
    if (q.type === 'TEXT') {
      const a = (ans as string).trim().toLowerCase();
      const c = (q.correctText || '').trim().toLowerCase();
      if (!a || !c) return false;
      if (q.matchMode === 'EXACT') return a === c;
      return a.includes(c) || c.includes(a);
    }
    if (q.type === 'NUMBER') {
      const a = parseFloat((ans as string).replace(',', '.'));
      const c = q.correctNumber ?? 0;
      if (isNaN(a)) return false;
      return Math.abs(a - c) <= (q.tolerance ?? 0.01);
    }
    if (q.type === 'TRUE_FALSE') return ans === q.correctBool;
    return false;
  };

  const submit = useCallback(
    async (isAuto = false) => {
      if (submitted) return;

      const newResults: Record<string, boolean> = {};
      let correctCount = 0;
      questions.forEach((q) => {
        const ok = checkAnswer(q, answers[q.id]);
        newResults[q.id] = ok;
        if (ok) correctCount++;
      });

      const total = questions.length;
      const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

      setLoading(true);
      try {
        await fetch('/api/tests/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId: test.id, answers, score: percent }),
        });
        setResults(newResults);
        setScore(percent);
        setSubmitted(true);
        if (isAuto) {
          setAutoSubmitted(true);
          toast.error('Время вышло! Работа отправлена автоматически');
        } else {
          toast.success(`Результат: ${correctCount}/${total} (${percent}%)`);
        }
      } catch {
        toast.error('Ошибка при отправке');
      } finally {
        setLoading(false);
      }
    },
    [answers, questions, submitted, test.id]
  );

  // Таймер
  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) {
      submit(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((s) => (s === null ? null : s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, submitted, submit]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
  const isWarning = secondsLeft !== null && secondsLeft <= 60;
  const isDanger = secondsLeft !== null && secondsLeft <= 30;

  return (
    <div className="p-8 max-w-3xl">
      {/* Таймер sticky */}
      {secondsLeft !== null && !submitted && (
        <div
          className={cn(
            'sticky top-4 z-30 mb-6 backdrop-blur-xl border rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg transition-colors',
            isDanger
              ? 'bg-red-500/20 border-red-500/50'
              : isWarning
              ? 'bg-amber-500/20 border-amber-500/50'
              : 'bg-white/5 border-white/10'
          )}
        >
          <div className="flex items-center gap-3">
            {isWarning ? (
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  isDanger ? 'text-red-400' : 'text-amber-400'
                )}
              />
            ) : (
              <Clock className="h-5 w-5 text-slate-400" />
            )}
            <span className="text-sm text-slate-300">
              {isDanger
                ? 'Скоро время выйдет!'
                : isWarning
                ? 'Осталось меньше минуты'
                : 'Время на выполнение'}
            </span>
          </div>
          <div
            className={cn(
              'font-mono text-2xl font-bold tabular-nums',
              isDanger
                ? 'text-red-400'
                : isWarning
                ? 'text-amber-400'
                : 'text-white'
            )}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
      <p className="text-slate-400 mb-8">
        Вопросов: {questions.length}
        {test.timeLimit && ` · Время: ${test.timeLimit} мин`}
      </p>

      <div className="space-y-4 mb-8">
        {questions.map((q, i) => {
          const ans = answers[q.id];
          const showResult = submitted && results[q.id] !== undefined;
          const isCorrect = results[q.id];

          return (
            <motion.div
              key={q.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'backdrop-blur-xl border rounded-2xl p-6',
                showResult
                  ? isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-red-500/5 border-red-500/30'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-white font-medium">{i + 1}.</span>
                <MathText className="text-white font-medium flex-1">
                  {q.text}
                </MathText>
                {showResult &&
                  (isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  ))}
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

              {q.type === 'SINGLE_CHOICE' && (
                <div className="space-y-2">
                  {(q.options || []).map((opt: string, idx: number) => {
                    const isSelected = ans === idx;
                    const showCorrect = showResult && idx === q.correct;
                    const showWrong = showResult && isSelected && !isCorrect;
                    return (
                      <button
                        key={idx}
                        onClick={() => setAnswer(q.id, idx)}
                        disabled={submitted}
                        className={cn(
                          'w-full text-left flex items-center gap-3 p-3 rounded-xl border transition',
                          showCorrect
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                            : showWrong
                            ? 'bg-red-500/20 border-red-500/50 text-red-200'
                            : isSelected
                            ? 'bg-purple-500/20 border-purple-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        )}
                      >
                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 text-xs">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <MathText className="text-sm flex-1">{opt}</MathText>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'MULTI_CHOICE' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" /> Можно выбрать несколько
                  </div>
                  {(q.options || []).map((opt: string, idx: number) => {
                    const selectedArr = (ans as number[]) || [];
                    const isSelected = selectedArr.includes(idx);
                    const isRight = (q.correctMulti || []).includes(idx);
                    const showCorrect = showResult && isRight;
                    const showWrong = showResult && isSelected && !isRight;
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleMulti(q.id, idx)}
                        disabled={submitted}
                        className={cn(
                          'w-full text-left flex items-center gap-3 p-3 rounded-xl border transition',
                          showCorrect
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                            : showWrong
                            ? 'bg-red-500/20 border-red-500/50 text-red-200'
                            : isSelected
                            ? 'bg-purple-500/20 border-purple-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 text-xs',
                            isSelected
                              ? 'bg-purple-500 border-purple-500 text-white'
                              : 'border-white/20'
                          )}
                        >
                          {isSelected && '✓'}
                        </div>
                        <MathText className="text-sm flex-1">{opt}</MathText>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'TEXT' && (
                <div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <AlignLeft className="h-3 w-3" /> Развёрнутый ответ
                  </div>
                  <textarea
                    value={(ans as string) || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    disabled={submitted}
                    placeholder="Напиши ответ..."
                    rows={3}
                    className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                  />
                  {showResult && !isCorrect && q.correctText && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-300 mb-0.5">
                        Правильный ответ:
                      </div>
                      <div className="text-sm text-emerald-200">
                        {q.correctText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {q.type === 'NUMBER' && (
                <div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Числовой ответ
                  </div>
                  <Input
                    value={(ans as string) || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    disabled={submitted}
                    placeholder="Введи число..."
                    className="bg-slate-950/50 border-white/10 text-white"
                  />
                  {showResult && !isCorrect && q.correctNumber !== undefined && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-300 mb-0.5">
                        Правильный:
                      </div>
                      <div className="text-sm text-emerald-200">
                        {q.correctNumber}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {q.type === 'TRUE_FALSE' && (
                <div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <ToggleLeft className="h-3 w-3" /> Правда или ложь
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAnswer(q.id, true)}
                      disabled={submitted}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition',
                        ans === true
                          ? 'bg-purple-500/20 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300',
                        submitted &&
                          q.correctBool === true &&
                          'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
                        submitted &&
                          ans === true &&
                          q.correctBool === false &&
                          'bg-red-500/20 border-red-500/50 text-red-200'
                      )}
                    >
                      ✓ Правда
                    </button>
                    <button
                      onClick={() => setAnswer(q.id, false)}
                      disabled={submitted}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition',
                        ans === false
                          ? 'bg-purple-500/20 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300',
                        submitted &&
                          q.correctBool === false &&
                          'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
                        submitted &&
                          ans === false &&
                          q.correctBool === true &&
                          'bg-red-500/20 border-red-500/50 text-red-200'
                      )}
                    >
                      ✗ Ложь
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!submitted ? (
        <Button
          onClick={() => submit(false)}
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Отправка...' : 'Завершить тест'}
        </Button>
      ) : (
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 text-center">
          {autoSubmitted && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-200">
              ⏰ Время вышло — работа отправлена автоматически
            </div>
          )}
          <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            {score}%
          </div>
          <p className="text-slate-300 mb-4">Твой результат</p>
          <Button
            onClick={() => router.push('/student/tests')}
            variant="outline"
            className="gap-2 border-white/20 hover:bg-white/5 text-white"
          >
            К списку тестов <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}