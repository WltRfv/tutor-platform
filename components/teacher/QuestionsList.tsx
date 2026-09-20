'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Trash2,
  Edit,
  HelpCircle,
  Circle,
  CheckSquare,
  AlignLeft,
  Hash,
  ToggleLeft,
  X,
  Upload,
} from 'lucide-react';
import { QuestionForm } from './QuestionForm';
import { cn } from '@/lib/utils';

type Subject = {
  id: string;
  name: string;
  category: string;
  grade: number | null;
};

export type QuestionItem = {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  difficulty: number;
  type: string;
  text: string;
  imageUrl: string | null;
  options: any;
  correct: number | null;
  correctMulti: any;
  correctText: string | null;
  matchMode: string | null;
  correctNumber: number | null;
  tolerance: number | null;
  correctBool: boolean | null;
  explanation: string | null;
  points: number;
  source: string | null;
  createdAt: string;
};

const TYPE_ICONS: Record<string, any> = {
  SINGLE_CHOICE: Circle,
  MULTI_CHOICE: CheckSquare,
  TEXT: AlignLeft,
  NUMBER: Hash,
  TRUE_FALSE: ToggleLeft,
};

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько',
  TEXT: 'Текст',
  NUMBER: 'Число',
  TRUE_FALSE: 'Правда/Ложь',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Легко',
  2: 'Средне',
  3: 'Сложно',
};

export function QuestionsList({
  subjects,
  initialQuestions,
}: {
  subjects: Subject[];
  initialQuestions: QuestionItem[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuestionItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (filterSubject && q.subjectId !== filterSubject) return false;
      if (filterType && q.type !== filterType) return false;
      if (filterTopic && q.topic !== filterTopic) return false;
      if (filterDifficulty && q.difficulty !== Number(filterDifficulty))
        return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !q.text.toLowerCase().includes(s) &&
          !q.topic.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [
    questions,
    filterSubject,
    filterType,
    filterTopic,
    filterDifficulty,
    search,
  ]);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (!filterSubject || q.subjectId === filterSubject) set.add(q.topic);
    });
    return Array.from(set).sort();
  }, [questions, filterSubject]);

  const handleSaved = (q: QuestionItem) => {
    setQuestions((prev) => {
      const exists = prev.find((x) => x.id === q.id);
      if (exists) return prev.map((x) => (x.id === q.id ? q : x));
      return [q, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить вопрос? Он останется в уже созданных тестах.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/teacher/questions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Ошибка удаления');
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success('Вопрос удалён');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const resetFilters = () => {
    setFilterSubject('');
    setFilterType('');
    setFilterTopic('');
    setFilterDifficulty('');
    setSearch('');
  };

  return (
    <div>
      {/* Заголовок */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Банк заданий</h1>
            <p className="text-slate-400 text-sm">
              Всего: {questions.length} · Отфильтровано: {filtered.length}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/teacher/questions/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition"
          >
            <Upload className="h-4 w-4" />
            Импорт
          </Link>
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
          >
            <Plus className="h-4 w-4" />
            Создать вопрос
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по тексту или теме..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterTopic('');
            }}
            className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="">Все предметы</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="">Все темы</option>
            {allTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-2 py-2 focus:outline-none"
            >
              <option value="">Все типы</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-2 py-2 focus:outline-none"
            >
              <option value="">Любая</option>
              <option value="1">Легко</option>
              <option value="2">Средне</option>
              <option value="3">Сложно</option>
            </select>
          </div>
        </div>

        {(filterSubject ||
          filterType ||
          filterTopic ||
          filterDifficulty ||
          search) && (
          <button
            onClick={resetFilters}
            className="mt-3 text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Сбросить фильтры
          </button>
        )}
      </div>

      {/* Форма */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <QuestionForm
              subjects={subjects}
              question={editing}
              onSaved={handleSaved}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{questions.length === 0 ? 'Банк пуст' : 'Ничего не найдено'}</p>
          {questions.length === 0 && (
            <p className="text-xs mt-2">
              Создай первый вопрос или импортируй из Google Docs
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => {
            const Icon = TYPE_ICONS[q.type] || HelpCircle;
            return (
              <div
                key={q.id}
                className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-500/30 transition flex items-start gap-4"
              >
                <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
                  <Icon className="h-4 w-4 text-purple-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white line-clamp-2 mb-1">
                    {q.text}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                      {q.subjectName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200">
                      {q.topic}
                    </span>
                    <span className="text-slate-400">
                      {TYPE_LABELS[q.type]}
                    </span>
                    <span className="text-slate-400">
                      {DIFFICULTY_LABELS[q.difficulty]}
                    </span>
                    <span className="text-slate-500">
                      {q.points} балл(ов)
                    </span>
                    {q.source === 'import' && (
                      <span className="text-slate-500 italic">· импорт</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      setEditing(q);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deleting === q.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}