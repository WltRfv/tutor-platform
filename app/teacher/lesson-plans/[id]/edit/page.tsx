'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft, BookMarked } from 'lucide-react';
import Link from 'next/link';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';

type Subject = { id: string; code: string; name: string; category: string; grade: number | null };
type Topic = { id: string; title: string; subjectId: string };

export default function EditLessonPlanPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [form, setForm] = useState({
    title: '',
    content: '',
    subjectId: '',
    topicId: '',
    duration: 45,
    published: false,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
      fetch(`/api/teacher/lesson-plans/${id}`).then((r) => r.json()),
    ])
      .then(([subjectsData, topicsData, planData]) => {
        if (planData.error) throw new Error(planData.error);
        setSubjects(subjectsData);
        setTopics(topicsData);
        setForm({
          title: planData.title || '',
          content: planData.content || '',
          subjectId: planData.subjectId || '',
          topicId: planData.topicId || '',
          duration: planData.duration || 45,
          published: !!planData.published,
        });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setFetching(false));
  }, [id]);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Заполни заголовок и содержание');
    }
    if (!form.subjectId) return toast.error('Выбери предмет');

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/lesson-plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          duration: form.duration,
          published: form.published,
        }),
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');
      toast.success('Методичка обновлена');
      router.push(`/teacher/lesson-plans/${id}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-64 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/5 rounded-xl" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <Link
        href={`/teacher/lesson-plans/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к методичке
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
          <BookMarked className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Редактирование</h1>
          <p className="text-slate-400 text-sm">Обнови содержание методички и сохрани</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Заголовок</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Квадратные уравнения — урок 1"
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label className="text-slate-300">Предмет</Label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value, topicId: '' })}
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              required
            >
              <option value="">— Выбери предмет —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-slate-300">Длительность, мин</Label>
            <Input
              type="number"
              min={15}
              max={180}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-slate-300">Тема (необязательно)</Label>
          <select
            value={form.topicId}
            onChange={(e) => setForm({ ...form, topicId: e.target.value })}
            className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
          >
            <option value="">— Без темы —</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-slate-300 mb-2 block">Содержание методички</Label>
          <MarkdownEditor
            value={form.content}
            onChange={(v) => setForm({ ...form, content: v })}
            placeholder="План урока, этапы, вопросы, разбор ошибок, домашка..."
            rows={22}
            lessonPlanId={id}
          />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">Отметить как готовую</span>
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