'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

type Question = {
  id: string;
  text: string;
  options: string[];
  correct: number;
};

export function TestRunner({
  test,
}: {
  test: { id: string; title: string; questions: Question[] };
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const questions = test.questions;

  const selectAnswer = (qId: string, idx: number) => {
    if (submitted) return;
    setAnswers({ ...answers, [qId]: idx });
  };

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return toast.error('Ответь на все вопросы');
    }

    const correct = questions.filter((q) => answers[q.id] === q.correct).length;
    const total = questions.length;
    const percent = Math.round((correct / total) * 100);

    setLoading(true);
    try {
      await fetch('/api/tests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id, answers, score: percent }),
      });
      setScore(percent);
      setSubmitted(true);
      toast.success(`Результат: ${correct}/${total} (${percent}%)`);
    } catch {
      toast.error('Ошибка при отправке');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-2">{test.title}</h1>
      <p className="text-slate-400 mb-8">Вопросов: {questions.length}</p>

      <div className="space-y-4 mb-8">
        {questions.map((q, i) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correct;

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="text-white font-medium mb-4">
                {i + 1}. {q.text}
              </div>
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const showCorrect = submitted && idx === q.correct;
                  const showWrong = submitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(q.id, idx)}
                      disabled={submitted}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition ${
                        showCorrect
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                          : showWrong
                          ? 'bg-red-500/20 border-red-500/50 text-red-200'
                          : isSelected
                          ? 'bg-purple-500/20 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 text-xs">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm flex-1">{opt}</span>
                      {showCorrect && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                      {showWrong && <XCircle className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!submitted ? (
        <Button
          onClick={submit}
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Отправка...' : 'Завершить тест'}
        </Button>
      ) : (
        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 text-center">
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