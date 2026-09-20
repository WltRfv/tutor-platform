'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Loader2,
  Layers,
  Edit,
  X,
  Save,
  BookOpen,
  FileText,
  ClipboardList,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Subject = { id: string; name: string; code: string };

type Topic = {
  id: string;
  subjectId: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  subject: { id: string; name: string };
  _count: { notes: number; tests: number; homeworks: number };
};

export function TopicsManager({
  subjects,
  initialTopics,
}: {
  subjects: Subject[];
  initialTopics: Topic[];
}) {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subjectId: subjects[0]?.id || '',
    title: '',
    description: '',
    order: 0,
  });

  const filtered = filterSubject
    ? topics.filter((t) => t.subjectId === filterSubject)
    : topics;

  const reset = () => {
    setForm({
      subjectId: subjects[0]?.id || '',
      title: '',
      description: '',
      order: 0,
    });
    setShowAdd(false);
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.subjectId) return toast.error('Выбери предмет');
    if (!form.title.trim()) return toast.error('Введи название темы');

    setLoading(true);
    try {
      const url = editingId
        ? `/api/teacher/topics/${editingId}`
        : '/api/teacher/topics';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Ошибка');
      toast.success(editingId ? 'Тема обновлена' : 'Тема создана');
      reset();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить тему? Все связанные материалы останутся без темы.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/topics/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка');
      setTopics((prev) => prev.filter((t) => t.id !== id));
      toast.success('Тема удалена');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (t: Topic) => {
    setEditingId(t.id);
    setForm({
      subjectId: t.subjectId,
      title: t.title,
      description: t.description || '',
      order: t.order,
    });
    setShowAdd(true);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Темы</h1>
            <p className="text-slate-400 text-sm">
              Управляй темами и открывай их ученикам
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            reset();
            setShowAdd(true);
          }}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          <Plus className="h-4 w-4" />
          Создать тему
        </Button>
      </div>

      {/* Фильтр по предмету */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSubject('')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm border transition',
            !filterSubject
              ? 'bg-purple-500/20 border-purple-500/30 text-white'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          )}
        >
          Все ({topics.length})
        </button>
        {subjects.map((s) => {
          const count = topics.filter((t) => t.subjectId === s.id).length;
          if (count === 0) return null;
          return (
            <button
              key={s.id}
              onClick={() => setFilterSubject(s.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm border transition',
                filterSubject === s.id
                  ? 'bg-purple-500/20 border-purple-500/30 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              )}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Форма */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  {editingId ? 'Редактировать тему' : 'Новая тема'}
                </h3>
                <button
                  onClick={reset}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Предмет</Label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500/50"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-slate-300">Название темы</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Например: Квадратные уравнения"
                      className="mt-2 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Порядок</Label>
                    <Input
                      type="number"
                      value={form.order}
                      onChange={(e) =>
                        setForm({ ...form, order: Number(e.target.value) })
                      }
                      className="mt-2 bg-white/5 border-white/10 text-white"
                    />
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

                <Button
                  onClick={submit}
                  disabled={loading}
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingId ? 'Сохранить изменения' : 'Создать тему'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет тем</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition"
            >
              <div className="flex items-start gap-4 flex-wrap">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
                  <Layers className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-semibold">{t.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                      {t.subject.name}
                    </span>
                    <span className="text-xs text-slate-500">#{t.order}</span>
                  </div>
                  {t.description && (
                    <p className="text-sm text-slate-400 mt-1">{t.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> {t._count.notes} конспектов
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {t._count.tests} тестов
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-3 w-3" /> {t._count.homeworks} ДЗ
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(t)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    disabled={loading}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Удалить"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}