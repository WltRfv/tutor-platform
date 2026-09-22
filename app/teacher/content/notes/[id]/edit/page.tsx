'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Table2,
  Sigma,
  SquareFunction,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { ImageUploader } from '@/components/shared/ImageUploader';

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

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    imageUrl: '',
    published: true,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
      fetch(`/api/teacher/notes/${id}`).then((r) => r.json()),
    ])
      .then(([subjectsData, topicsData, noteData]) => {
        if (noteData.error) throw new Error(noteData.error);
        setSubjects(subjectsData);
        setTopics(topicsData);
        setForm({
          title: noteData.title || '',
          content: noteData.content || '',
          subjectId: noteData.subjectId || '',
          topicId: noteData.topicId || '',
          imageUrl: noteData.imageUrl || '',
          published: !!noteData.published,
        });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setFetching(false));
  }, [id]);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл больше 5 МБ');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Только изображения');
      return;
    }
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
    if (!form.subjectId) {
      return toast.error('Выбери предмет');
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          imageUrl: form.imageUrl || null,
          published: form.published,
        }),
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');
      toast.success('Конспект обновлён');
      router.push(`/teacher/content/notes/${id}`);
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
        href={`/teacher/content/notes/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к конспекту
      </Link>

      <h1 className="text-3xl font-bold text-white mb-1">Редактирование</h1>
      <p className="text-slate-400 mb-8">
        Обнови содержимое и сохрани изменения
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Заголовок</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Квадратные уравнения"
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
              <option value="">— Выбери предмет —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
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
              <option value="">— Без темы —</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {availableTopics.length === 0 && form.subjectId && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠️ По этому предмету нет тем. Создай их в разделе «Темы»
              </p>
            )}
          </div>
        </div>

        {/* Содержание с панелью вставки */}
        <div>
          <Label className="text-slate-300">Содержание</Label>

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
                  '\n| Заголовок 1 | Заголовок 2 |\n|---|---|\n|  |  |\n|  |  |\n'
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
            placeholder="Текст конспекта. Поддерживается markdown: картинки, таблицы, списки, формулы."
            rows={18}
            className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50 leading-relaxed"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            💡 Формулы: <code className="text-purple-300">$x^2$</code> (инлайн),{' '}
            <code className="text-purple-300">$$...$$</code> (блок). Картинки:{' '}
            <code className="text-purple-300">![alt](url)</code>. Таблицы: markdown.
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">
              Обложка конспекта
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Картинка появится сверху конспекта у ученика
          </p>
          <ImageUploader
            label="Картинка-обложка"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
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
            Опубликован (ученики видят)
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
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </form>
    </div>
  );
}