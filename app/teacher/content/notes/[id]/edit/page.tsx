'use client';
import { useState, useEffect } from 'react';
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
  FileText,
  Presentation as PresentationIcon,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { cn } from '@/lib/utils';

type Subject = { id: string; code: string; name: string; category: string; grade: number | null };
type Topic = { id: string; title: string; subjectId: string };
type Presentation = {
  id: string;
  title: string;
  subjectId: string;
  slidesCount: number;
};

type Mode = 'TEXT' | 'PRESENTATION';

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [mode, setMode] = useState<Mode>('TEXT');

  const [form, setForm] = useState({
    title: '',
    content: '',
    practiceContent: '',
    selfWorkContent: '',
    subjectId: '',
    topicId: '',
    imageUrl: '',
    published: true,
    presentationId: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
      fetch('/api/teacher/presentations').then((r) => r.json()),
      fetch(`/api/teacher/notes/${id}`).then((r) => r.json()),
    ])
      .then(([subjectsData, topicsData, presentationsData, noteData]) => {
        if (noteData.error) throw new Error(noteData.error);
        setSubjects(subjectsData);
        setTopics(topicsData);
        setPresentations(presentationsData);
        setForm({
          title: noteData.title || '',
          content: noteData.content || '',
          practiceContent: noteData.practiceContent || '',
          selfWorkContent: noteData.selfWorkContent || '',
          subjectId: noteData.subjectId || '',
          topicId: noteData.topicId || '',
          imageUrl: noteData.imageUrl || '',
          published: !!noteData.published,
          presentationId: noteData.presentationId || '',
        });
        setMode(noteData.presentationId ? 'PRESENTATION' : 'TEXT');
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setFetching(false));
  }, [id]);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);
  const availablePresentations = presentations.filter(
    (p) => p.subjectId === form.subjectId
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи заголовок');
    if (!form.subjectId) return toast.error('Выбери предмет');
    if (mode === 'TEXT' && !form.content.trim()) {
      return toast.error('Заполни содержание');
    }
    if (mode === 'PRESENTATION' && !form.presentationId) {
      return toast.error('Выбери презентацию');
    }

    setLoading(true);
    try {
      // 1) основной PATCH
      const res = await fetch(`/api/teacher/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: mode === 'TEXT' ? form.content : form.content || ' ',
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          imageUrl: form.imageUrl || null,
          published: form.published,
        }),
      });
      if (!res.ok) throw new Error('Ошибка при сохранении');

      // 2) практика + самостоятельная
      const res2 = await fetch(`/api/teacher/notes/${id}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceContent: form.practiceContent,
          selfWorkContent: form.selfWorkContent,
        }),
      });
      if (!res2.ok) throw new Error('Ошибка сохранения практики/самостоятельной');

      // 3) презентация
      const res3 = await fetch(`/api/teacher/notes/${id}/presentation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId:
            mode === 'PRESENTATION' ? form.presentationId : null,
        }),
      });
      if (!res3.ok) throw new Error('Ошибка сохранения презентации');

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
        href={`/teacher/content/notes/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к конспекту
      </Link>

      <h1 className="text-3xl font-bold text-white mb-1">Редактирование</h1>
      <p className="text-slate-400 mb-6">
        Тип можно менять: текст ↔ презентация
      </p>

      {/* Переключатель типа */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
        <button
          type="button"
          onClick={() => setMode('TEXT')}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition',
            mode === 'TEXT'
              ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <FileText className="h-4 w-4" />
          📄 Текстовый конспект
        </button>
        <button
          type="button"
          onClick={() => setMode('PRESENTATION')}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition',
            mode === 'PRESENTATION'
              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-white'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <PresentationIcon className="h-4 w-4" />
          🎞 Из презентации
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Заголовок</Label>
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
              value={form.subjectId}
              onChange={(e) =>
                setForm({
                  ...form,
                  subjectId: e.target.value,
                  topicId: '',
                  presentationId: '',
                })
              }
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
              required
            >
              <option value="">- Выбери предмет -</option>
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
          </div>
        </div>

        {/* Основной контент по режиму */}
        {mode === 'TEXT' ? (
          <div>
            <Label className="text-slate-300 mb-2 block">📖 Теория</Label>
            <MarkdownEditor
              value={form.content}
              onChange={(v) => setForm({ ...form, content: v })}
              placeholder="Основной текст конспекта — правила, определения, разбор"
              rows={16}
              noteId={id}
            />
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <PresentationIcon className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <div className="font-semibold text-white mb-1">
                  Выбрана презентация
                </div>
                <div className="text-xs text-slate-400">
                  На вкладке «Теория» ученик увидит плеер слайдов вместо
                  текста. Практика и самостоятельная работа — отдельно ниже.
                </div>
              </div>
            </div>

            {availablePresentations.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl">
                <p className="text-sm text-slate-400 mb-3">
                  Нет презентаций по выбранному предмету
                </p>
                <Link
                  href="/teacher/presentations/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Создать презентацию
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-2 max-h-72 overflow-y-auto">
                  {availablePresentations.map((p) => {
                    const active = form.presentationId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, presentationId: p.id })
                        }
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition',
                          active
                            ? 'bg-pink-500/15 border-pink-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        )}
                      >
                        <div
                          className={cn(
                            'p-2 rounded-lg flex-shrink-0',
                            active
                              ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                              : 'bg-white/10'
                          )}
                        >
                          <PresentationIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">
                            {p.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.slidesCount} слайдов
                          </div>
                        </div>
                        {active && (
                          <span className="text-xs text-pink-300 font-semibold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Link
                  href="/teacher/presentations/new"
                  className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Создать ещё одну презентацию
                </Link>
              </>
            )}
          </div>
        )}

        <div>
          <Label className="text-slate-300 mb-2 block">
            🔧 Практика на занятии (необязательно)
          </Label>
          <MarkdownEditor
            value={form.practiceContent}
            onChange={(v) => setForm({ ...form, practiceContent: v })}
            placeholder="Задания, которые разбирали вместе"
            rows={12}
          />
        </div>

        <div>
          <Label className="text-slate-300 mb-2 block">
            ✅ Самостоятельная работа (необязательно)
          </Label>
          <MarkdownEditor
            value={form.selfWorkContent}
            onChange={(v) => setForm({ ...form, selfWorkContent: v })}
            placeholder="Что ученик делает сам"
            rows={12}
          />
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Обложка конспекта</h3>
          </div>
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
          <span className="text-sm text-slate-200">Опубликован</span>
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