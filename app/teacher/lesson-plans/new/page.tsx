'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  ArrowLeft,
  Table2,
  Sigma,
  SquareFunction,
  Upload,
  BookMarked,
} from 'lucide-react';
import Link from 'next/link';

type Subject = {
  id: string;
  code: string;
  name: string;
  category: string;
  grade: number | null;
};

type Topic = {
  id: string;
  title: string;
  subjectId: string;
};

export default function NewLessonPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [uploadingInline, setUploadingInline] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    ])
      .then(([subjectsData, topicsData]) => {
        setSubjects(subjectsData);
        setTopics(topicsData);
        if (subjectsData.length > 0 && !form.subjectId) {
          setForm((f) => ({ ...f, subjectId: subjectsData[0].id }));
        }
      })
      .catch(() => toast.error('Не удалось загрузить данные'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);

  const insertAtCursor = (text: string) => {
    const el = contentRef.current;
    if (!el) {
      setForm((f) => ({ ...f, content: f.content + text }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = form.content.slice(0, start) + text + form.content.slice(end);
    setForm((f) => ({ ...f, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  };

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Файл больше 5 МБ');
    if (!file.type.startsWith('image/')) return toast.error('Только изображения');

    setUploadingInline(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/teacher/upload-image', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      insertAtCursor(`\n![${file.name}](${data.url})\n`);
      toast.success('Картинка вставлена');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingInline(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Заполни заголовок и содержание');
    }
    if (!form.subjectId) return toast.error('Выбери предмет');

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/lesson-plans', {
        method: 'POST',
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
      if (!res.ok) throw new Error('Ошибка при создании');
      toast.success('Методичка создана');
      router.push('/teacher/lesson-plans');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/teacher/lesson-plans"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К методичкам
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
          <BookMarked className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Новая методичка</h1>
          <p className="text-slate-400 text-sm">
            Видят только учителя. Ученику она не показывается.
          </p>
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
              onChange={(e) =>
                setForm({ ...form, subjectId: e.target.value, topicId: '' })
              }
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              required
            >
              <option value="">— Выбери предмет —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
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
              onChange={(e) =>
                setForm({ ...form, duration: Number(e.target.value) })
              }
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
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-slate-300">Содержание методички</Label>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingInline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              {uploadingInline ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Картинка
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInlineUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                insertAtCursor(
                  '\n| Этап | Время | Что делает учитель |\n|---|---|---|\n|  |  |  |\n'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition"
            >
              <Table2 className="h-3.5 w-3.5" />
              Таблица
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('$x^2$')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition"
            >
              <Sigma className="h-3.5 w-3.5" />
              Формула
            </button>

            <button
              type="button"
              onClick={() => insertAtCursor('\n$$\n\n$$\n')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition"
            >
              <SquareFunction className="h-3.5 w-3.5" />
              Блок формулы
            </button>
          </div>

          <textarea
            ref={contentRef}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="План урока, этапы, вопросы, разбор ошибок, домашка..."
            rows={22}
            className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50 leading-relaxed"
            required
          />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">
            Отметить как готовую (для себя — статус)
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Сохранение...' : 'Сохранить методичку'}
        </Button>
      </form>
    </div>
  );
}