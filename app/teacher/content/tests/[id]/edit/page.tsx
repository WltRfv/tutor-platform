'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const SUBJECTS = [
  { value: 'MATH_5_6', label: 'Математика 5–6' },
  { value: 'ALGEBRA_7_9', label: 'Алгебра 7–9' },
  { value: 'GEOMETRY_7_9', label: 'Геометрия 7–9' },
  { value: 'OGE_PREP', label: 'Подготовка к ОГЭ' },
  { value: 'VPR_PREP', label: 'Подготовка к ВПР' },
  { value: 'INFORMATICS', label: 'Информатика' },
];

type Question = {
  id?: string;
  text: string;
  options: string[];
  correct: number;
};

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    title: '',
    subject: 'INFORMATICS',
    timeLimit: 15,
    published: true,
  });
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], correct: 0 },
  ]);

  useEffect(() => {
    fetch(`/api/teacher/tests/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setForm({
          title: data.title,
          subject: data.subject,
          timeLimit: data.timeLimit || 15,
          published: data.published,
        });
        const qs = (data.questions as Question[]) || [];
        setQuestions(
          qs.length
            ? qs.map((q) => ({
                text: q.text,
                options: q.options,
                correct: q.correct,
              }))
            : [{ text: '', options: ['', '', '', ''], correct: 0 }]
        );
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setFetching(false));
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length === 1) return toast.error('Должен быть хотя бы 1 вопрос');
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, patch: Partial<Question>) => {
    const next = [...questions];
    next[i] = { ...next[i], ...patch };
    setQuestions(next);
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    const next = [...questions];
    next[qi].options[oi] = val;
    setQuestions(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error('Введи название теста');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return toast.error(`Вопрос ${i + 1}: пустой текст`);
      if (q.options.some((o) => !o.trim()))
        return toast.error(`Вопрос ${i + 1}: заполни все варианты`);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          questions: questions.map((q, i) => ({
            id: q.id || `q${i + 1}`,
            text: q.text,
            options: q.options,
            correct: q.correct,
          })),
        }),
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');
      toast.success('Тест обновлён');
      router.push(`/teacher/content/tests/${id}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-64 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={`/teacher/content/tests/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к тесту
      </Link>

      <h1 className="text-3xl font-bold text-white mb-1">Редактирование теста</h1>
      <p className="text-slate-400 mb-8">Обнови вопросы и сохрани изменения</p>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <Label className="text-slate-300">Название теста</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Предмет</Label>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-slate-300">Ограничение времени (мин)</Label>
            <Input
              type="number"
              min={1}
              value={form.timeLimit}
              onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {questions.map((q, qi) => (
              <motion.div
                key={qi}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-purple-300 font-semibold">
                    Вопрос {qi + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Input
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                  placeholder="Текст вопроса"
                  className="mb-4 bg-white/5 border-white/10 text-white"
                  required
                />

                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isCorrect = q.correct === oi;
                    return (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qi, { correct: oi })}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                            isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-white/20 text-slate-400 hover:border-emerald-500/50'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            String.fromCharCode(65 + oi)
                          )}
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          placeholder={`Вариант ${String.fromCharCode(65 + oi)}`}
                          className="bg-white/5 border-white/10 text-white"
                          required
                        />
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  ✅ Нажми на букву слева, чтобы отметить правильный вариант
                </p>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            type="button"
            onClick={addQuestion}
            variant="outline"
            className="w-full gap-2 border-white/20 text-white hover:bg-white/5"
          >
            <Plus className="h-4 w-4" /> Добавить вопрос
          </Button>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">Опубликован (ученики видят)</span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </form>
    </div>
  );
}