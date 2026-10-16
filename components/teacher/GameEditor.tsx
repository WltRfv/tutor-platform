'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type CardItem = {
  id?: string;
  question: string;
  answer: string;
};

type Props = {
  gameId?: string;
  initial?: {
    title: string;
    description: string;
    subjectId: string;
    topicId: string;
    published: boolean;
    items: CardItem[];
  };
};

type Subject = { id: string; name: string };
type Topic = { id: string; title: string; subjectId: string };

export function GameEditor({ gameId, initial }: Props) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!initial);

  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    subjectId: initial?.subjectId || '',
    topicId: initial?.topicId || '',
    published: initial?.published ?? false,
  });

  const [items, setItems] = useState<CardItem[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [{ question: '', answer: '' }]
  );

  useState(() => {
    if (initial) return;
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
  });

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);

  const addItem = () => setItems([...items, { question: '', answer: '' }]);

  const removeItem = (i: number) => {
    if (items.length === 1) return toast.error('Нужна хотя бы одна карточка');
    setItems(items.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, patch: Partial<CardItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    setItems(next);
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи название игры');
    if (!form.subjectId) return toast.error('Выбери предмет');

    const cleanItems = items
      .map((it) => ({
        question: it.question.trim(),
        answer: it.answer.trim(),
      }))
      .filter((it) => it.question && it.answer);

    if (cleanItems.length === 0) {
      return toast.error('Заполни хотя бы одну карточку');
    }

    setLoading(true);
    try {
      const url = gameId
        ? `/api/teacher/games/${gameId}`
        : '/api/teacher/games';
      const method = gameId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CARDS',
          title: form.title,
          description: form.description || null,
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          published: form.published,
          items: cleanItems.map((it) => ({
            payload: { question: it.question, answer: it.answer },
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(gameId ? 'Игра обновлена' : 'Игра создана');
      router.push('/teacher/games');
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
    <div className="p-8 max-w-4xl">
      <Link
        href="/teacher/games"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К играм
      </Link>

      <h1 className="text-3xl font-bold text-white mb-1">
        {gameId ? 'Редактирование игры' : 'Новая игра — Карточки'}
      </h1>
      <p className="text-slate-400 mb-6">
        Ученик читает вопрос, открывает ответ, отмечает «знал / не знал»
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Название</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Формулы сокращённого умножения"
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
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
              required
            >
              <option value="">- Выбери -</option>
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
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            >
              <option value="">- Без темы -</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label className="text-slate-300">Описание (необязательно)</Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-slate-300">
              Карточки ({items.length})
            </Label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Добавить карточку
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {items.map((it, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="rounded-xl bg-slate-950/50 border border-white/10 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-purple-300">
                      Карточка {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(i, i - 1)}
                        disabled={i === 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(i, i + 1)}
                        disabled={i === items.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] text-slate-400">
                        Вопрос (лицо карточки)
                      </Label>
                      <textarea
                        value={it.question}
                        onChange={(e) =>
                          updateItem(i, { question: e.target.value })
                        }
                        rows={2}
                        placeholder="Что такое одночлен?"
                        className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-400">
                        Ответ (обратная сторона)
                      </Label>
                      <textarea
                        value={it.answer}
                        onChange={(e) =>
                          updateItem(i, { answer: e.target.value })
                        }
                        rows={2}
                        placeholder="Это произведение чисел, переменных и их степеней"
                        className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">
            Опубликовать (ученики увидят после открытия темы)
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? 'Сохранение...' : gameId ? 'Сохранить изменения' : 'Создать игру'}
        </Button>
      </form>
    </div>
  );
}