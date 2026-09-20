'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  ArrowLeft,
  ClipboardList,
  Globe,
  User as UserIcon,
  Plus,
  Trash2,
  ListChecks,
  FileText,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/shared/ImageUploader';

type Subject = { id: string; name: string; category: string };
type Topic = { id: string; title: string; subjectId: string };
type Student = {
  id: string;
  name: string;
  grade: number | null;
  email: string;
  subjects: { id: string; name: string }[];
};

type TaskType = 'TEXT' | 'CODE';

type Task = {
  taskType: TaskType;
  text: string;
  imageUrl: string;
  correctAnswer: string;
  answerType: 'TEXT' | 'NUMBER' | 'EXACT';
  points: number;
  language: string;
  starterCode: string;
};

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'pascal', label: 'Pascal' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c++', label: 'C++' },
  { value: 'java', label: 'Java' },
];

const emptyTask = (): Task => ({
  taskType: 'TEXT',
  text: '',
  imageUrl: '',
  correctAnswer: '',
  answerType: 'TEXT',
  points: 1,
  language: 'python',
  starterCode: '',
});

export default function NewHomeworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    topicId: '',
    imageUrl: '',
    dueDate: '',
    targetType: 'ALL' as 'ALL' | 'SPECIFIC',
    targetUserId: '',
  });

  const [tasks, setTasks] = useState<Task[]>([emptyTask()]);

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
      fetch('/api/teacher/students-list').then((r) => r.json()),
    ])
      .then(([subjectsData, topicsData, studentsData]) => {
        setSubjects(subjectsData);
        setTopics(topicsData);
        setStudents(studentsData);
        if (subjectsData.length > 0 && !form.subjectId) {
          setForm((f) => ({ ...f, subjectId: subjectsData[0].id }));
        }
      })
      .catch(() => toast.error('Не удалось загрузить данные'));
  }, []);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);
  const filteredStudents = students.filter((s) =>
    s.subjects?.some((sub) => sub.id === form.subjectId)
  );

  const addTask = () => setTasks([...tasks, emptyTask()]);

  const removeTask = (i: number) => {
    if (tasks.length === 1) return toast.error('Нужна хотя бы 1 задача');
    setTasks(tasks.filter((_, idx) => idx !== i));
  };

  const updateTask = (i: number, patch: Partial<Task>) => {
    const next = [...tasks];
    next[i] = { ...next[i], ...patch };
    setTasks(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи заголовок');
    if (!form.subjectId) return toast.error('Выбери предмет');
    if (form.targetType === 'SPECIFIC' && !form.targetUserId) {
      return toast.error('Выбери ученика');
    }
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].text.trim()) {
        return toast.error(`Задача ${i + 1}: пустое условие`);
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          subjectId: form.subjectId,
          topicId: form.topicId || null,
          imageUrl: form.imageUrl || null,
          dueDate: form.dueDate || null,
          targetType: form.targetType,
          targetUserId: form.targetUserId || null,
          tasks: tasks.map((t) => ({
            text: t.text,
            imageUrl: t.imageUrl || null,
            correctAnswer:
              t.taskType === 'TEXT' ? t.correctAnswer || null : null,
            answerType: t.answerType,
            points: t.points,
            language: t.taskType === 'CODE' ? t.language : null,
            starterCode:
              t.taskType === 'CODE' && t.starterCode ? t.starterCode : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Задание создано (${tasks.length} задач)`);
      router.push('/teacher/homework');
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
        href="/teacher/homework"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> К списку заданий
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Новое задание</h1>
          <p className="text-slate-400 text-sm">
            Обычные задачи или задачи с кодом
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="text-slate-300">Название задания</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Домашнее задание на 20 сентября"
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
                  targetUserId: '',
                })
              }
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
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
              className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            >
              <option value="">— Без темы —</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label className="text-slate-300 mb-2 block">Кому дать задание</Label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() =>
                setForm({ ...form, targetType: 'ALL', targetUserId: '' })
              }
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                form.targetType === 'ALL'
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Globe className="h-4 w-4" />
              Всем ученикам
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, targetType: 'SPECIFIC' })}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                form.targetType === 'SPECIFIC'
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <UserIcon className="h-4 w-4" />
              Конкретному
            </button>
          </div>
        </div>

        {form.targetType === 'SPECIFIC' && (
          <div>
            <Label className="text-slate-300">Выбери ученика</Label>
            {filteredStudents.length === 0 ? (
              <p className="mt-2 text-sm text-amber-400 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                ⚠️ Нет учеников с этим предметом
              </p>
            ) : (
              <select
                value={form.targetUserId}
                onChange={(e) =>
                  setForm({ ...form, targetUserId: e.target.value })
                }
                className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                required
              >
                <option value="">— Выбери ученика —</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.grade ? `(${s.grade} кл.)` : ''} — {s.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <Label className="text-slate-300">Общее описание</Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Общая инструкция для всего задания..."
            rows={3}
            className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* КОНСТРУКТОР ЗАДАЧ */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">
                Задачи ({tasks.length})
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="rounded-xl bg-slate-950/50 border border-white/10 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-purple-300">
                      Задача {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(i)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Тип задачи */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => updateTask(i, { taskType: 'TEXT' })}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition',
                        t.taskType === 'TEXT'
                          ? 'bg-purple-500/20 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Текстовая задача
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTask(i, { taskType: 'CODE' })}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition',
                        t.taskType === 'CODE'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      )}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Программирование
                    </button>
                  </div>

                  <textarea
                    value={t.text}
                    onChange={(e) => updateTask(i, { text: e.target.value })}
                    placeholder="Условие задачи... (можно $x^2$)"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-3 text-sm resize-y focus:outline-none focus:border-purple-500/50 mb-3"
                  />

                  <div className="mb-3">
                    <ImageUploader
                      label="Картинка к задаче"
                      value={t.imageUrl}
                      onChange={(url) => updateTask(i, { imageUrl: url })}
                    />
                  </div>

                  {/* Поля для текстовой задачи */}
                  {t.taskType === 'TEXT' && (
                    <div className="grid md:grid-cols-3 gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <div className="md:col-span-1">
                        <Label className="text-[11px] text-slate-400">
                          Правильный ответ
                        </Label>
                        <Input
                          value={t.correctAnswer}
                          onChange={(e) =>
                            updateTask(i, { correctAnswer: e.target.value })
                          }
                          placeholder="Опционально"
                          className="mt-1 h-9 bg-white/5 border-white/10 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">
                          Тип
                        </Label>
                        <select
                          value={t.answerType}
                          onChange={(e) =>
                            updateTask(i, {
                              answerType: e.target.value as any,
                            })
                          }
                          className="mt-1 w-full h-9 bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-2 focus:outline-none"
                        >
                          <option value="TEXT">Текст</option>
                          <option value="NUMBER">Число</option>
                          <option value="EXACT">Точное</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">
                          Баллы
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={t.points}
                          onChange={(e) =>
                            updateTask(i, { points: Number(e.target.value) })
                          }
                          className="mt-1 h-9 bg-white/5 border-white/10 text-white text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Поля для задачи с кодом */}
                  {t.taskType === 'CODE' && (
                    <div className="space-y-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[11px] text-slate-400">
                            Язык программирования
                          </Label>
                          <select
                            value={t.language}
                            onChange={(e) =>
                              updateTask(i, { language: e.target.value })
                            }
                            className="mt-1 w-full h-9 bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-2 focus:outline-none"
                          >
                            {LANGUAGES.map((l) => (
                              <option key={l.value} value={l.value}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-[11px] text-slate-400">
                            Баллы
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            value={t.points}
                            onChange={(e) =>
                              updateTask(i, {
                                points: Number(e.target.value),
                              })
                            }
                            className="mt-1 h-9 bg-white/5 border-white/10 text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px] text-slate-400">
                          Начальный код (шаблон для ученика, необязательно)
                        </Label>
                        <textarea
                          value={t.starterCode}
                          onChange={(e) =>
                            updateTask(i, { starterCode: e.target.value })
                          }
                          placeholder={
                            t.language === 'python'
                              ? '# Начальный код\nprint("Привет!")\n'
                              : t.language === 'pascal'
                              ? 'program Task;\nbegin\n  writeln(\'Привет!\');\nend.\n'
                              : '// Начальный код\n'
                          }
                          rows={5}
                          spellCheck={false}
                          className="mt-1 w-full bg-slate-950/80 border border-white/10 text-slate-100 rounded-lg p-3 text-xs font-mono resize-y focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              type="button"
              onClick={addTask}
              variant="outline"
              className="w-full gap-2 border-white/20 text-white hover:bg-white/5"
            >
              <Plus className="h-4 w-4" /> Добавить задачу
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <ImageUploader
              label="Общая картинка (необязательно)"
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          <div>
            <Label className="text-slate-300">Срок сдачи</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

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
          {loading ? 'Создание...' : `Создать задание (${tasks.length} задач)`}
        </Button>
      </form>
    </div>
  );
}