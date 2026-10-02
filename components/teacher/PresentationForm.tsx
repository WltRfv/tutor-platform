'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, ArrowLeft, Presentation as PresentationIcon } from 'lucide-react';
import Link from 'next/link';
import { SlidesEditor, type SlideDraft } from './SlidesEditor';
import { ImageUploader } from '@/components/shared/ImageUploader';

type Subject = { id: string; name: string };
type Topic = { id: string; title: string; subjectId: string };

type InitialData = {
  title: string;
  subjectId: string;
  topicId: string;
  imageUrl: string;
  published: boolean;
  slides: SlideDraft[];
};

export function PresentationForm({
  presentationId,
  initial,
}: {
  presentationId?: string;
  initial?: InitialData;
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!initial);

  const [form, setForm] = useState({
    title: initial?.title || '',
    subjectId: initial?.subjectId || '',
    topicId: initial?.topicId || '',
    imageUrl: initial?.imageUrl || '',
    published: initial?.published ?? false,
  });

  const [slides, setSlides] = useState<SlideDraft[]>(
    initial?.slides || [{ title: '', content: '', imageUrl: '' }]
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
    ])
      .then(([subjectsData, topicsData]) => {
        setSubjects(subjectsData);
        setTopics(topicsData);
        if (subjectsData.length > 0 && !form.subjectId) {
          setForm((f) => ({ ...f, subjectId: subjectsData[0].id }));
        }
      })
      .catch(() => toast.error('Не удалось загрузить данные'))
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи заголовок');
    if (!form.subjectId) return toast.error('Выбери предмет');
    if (slides.length === 0) return toast.error('Добавь хотя бы один слайд');
    for (let i = 0; i < slides.length; i++) {
      if (!slides[i].content.trim()) {
        return toast.error(`Слайд ${i + 1}: пустой`);
      }
    }

    setLoading(true);
    try {
      const url = presentationId
        ? `/api/teacher/presentations/${presentationId}`
        : '/api/teacher/presentations';
      const method = presentationId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          imageUrl: form.imageUrl || null,
          published: form.published,
          slides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(presentationId ? 'Презентация обновлена' : 'Презентация создана');
      router.push('/teacher/presentations');
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
        href="/teacher/presentations"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К презентациям
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
          <PresentationIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {presentationId ? 'Редактирование' : 'Новая презентация'}
          </h1>
          <p className="text-slate-400 text-sm">
            Слайды с markdown, формулами и картинками
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Заголовок презентации</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Таблицы — введение"
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Предмет</Label>
            <select
              value={form.subjectId}
              onChange={(e) =>
                setForm({ ...form, subjectId: e.target.value, topicId: '' })
              }
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              required
            >
              <option value="">- Выбери -</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-slate-300">Тема (необязательно)</Label>
            <select
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: e.target.value })}
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
            >
              <option value="">- Без темы -</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {availableTopics.length === 0 && form.subjectId && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠️ По этому предмету нет тем
              </p>
            )}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <PresentationIcon className="h-4 w-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Обложка презентации</h3>
          </div>
          <ImageUploader
            label="Картинка-обложка (необязательно)"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />
        </div>

        <div>
          <Label className="text-slate-300 mb-3 block">Слайды</Label>
          <SlidesEditor slides={slides} onChange={setSlides} />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">
            Опубликовать (ученики увидят, когда учитель откроет тему)
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Сохранение...' : presentationId ? 'Сохранить изменения' : 'Создать презентацию'}
        </Button>
      </form>
    </div>
  );
}