'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    timeLimit: 15,
    attemptsAllowed: 1,
    published: true,
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [mode, setMode] = useState('MANUAL');

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch(`/api/teacher/tests/${id}`).then((r) => r.json()),
    ])
      .then(([subjectsData, testData]) => {
        setSubjects(subjectsData);
        if (testData.error) throw new Error(testData.error);
        setForm({
          title: testData.title,
          subjectId: testData.subjectId,
          topicId: testData.topicId || '',
          timeLimit: testData.timeLimit || 15,
          attemptsAllowed: testData.attemptsAllowed || 1,
          published: testData.published,
        });
        setQuestions((testData.questions as any[]) || []);
        setMode(testData.mode);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setFetching(false));
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи название');

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          timeLimit: form.timeLimit,
          attemptsAllowed: form.attemptsAllowed,
          published: form.published,
          ...(mode === 'MANUAL' && { questions }),
        }),
      });
      if (!res.ok) throw new Error('Ошибка');
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
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href={`/teacher/content/tests/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <h1 className="text-3xl font-bold text-white mb-1">Редактирование</h1>
      <p className="text-slate-400 mb-6 text-sm">
        {mode === 'BANK_CUSTOM' && (
          <span className="text-amber-400">
            ⚠️ Тест из банка — вопросы изменить нельзя, только параметры
          </span>
        )}
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Название</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Время (мин)</Label>
            <Input
              type="number"
              value={form.timeLimit}
              onChange={(e) =>
                setForm({ ...form, timeLimit: Number(e.target.value) })
              }
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300">Попыток</Label>
            <Input
              type="number"
              value={form.attemptsAllowed}
              onChange={(e) =>
                setForm({ ...form, attemptsAllowed: Number(e.target.value) })
              }
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">Опубликован</span>
        </label>

        {mode === 'BANK_CUSTOM' && (
          <div className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-200">
            Вопросы этого теста собраны из банка ({questions.length} шт).
            Если нужно изменить — удали тест и создай новый.
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </form>
    </div>
  );
}