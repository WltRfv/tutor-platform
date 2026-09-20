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
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CheckSquare,
  AlignLeft,
  Hash,
  ToggleLeft,
  Wand2,
  PenSquare,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { cn } from '@/lib/utils';

type Subject = { id: string; name: string };
type Topic = { id: string; title: string; subjectId: string };

type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'TEXT'
  | 'NUMBER'
  | 'TRUE_FALSE';

type Question = {
  type: QuestionType;
  text: string;
  imageUrl: string;
  options: string[];
  correct: number;
  correctMulti: number[];
  correctText: string;
  textMatchMode: 'CONTAINS' | 'EXACT';
  correctNumber: string;
  tolerance: string;
  correctBool: boolean | null;
  points: number;
  bankId?: string;
  subjectName?: string;
};

type BankPick = { subjectId: string; topic: string };

type BankTopic = {
  subjectId: string;
  subjectName: string;
  subjectGrade: number | null;
  topic: string;
  count: number;
};

const TYPE_LABELS: Record<QuestionType, { label: string; icon: any }> = {
  SINGLE_CHOICE: { label: 'Один', icon: Circle },
  MULTI_CHOICE: { label: 'Несколько', icon: CheckSquare },
  TEXT: { label: 'Текст', icon: AlignLeft },
  NUMBER: { label: 'Число', icon: Hash },
  TRUE_FALSE: { label: 'Правда/Ложь', icon: ToggleLeft },
};

const emptyQuestion = (): Question => ({
  type: 'SINGLE_CHOICE',
  text: '',
  imageUrl: '',
  options: ['', '', '', ''],
  correct: 0,
  correctMulti: [],
  correctText: '',
  textMatchMode: 'CONTAINS',
  correctNumber: '',
  tolerance: '0.01',
  correctBool: null,
  points: 1,
});

function groupTopicsBySubject(topics: BankTopic[]) {
  const map = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      subjectGrade: number | null;
      topics: { subjectId: string; topic: string; count: number }[];
    }
  >();

  topics.forEach((t) => {
    if (!map.has(t.subjectId)) {
      map.set(t.subjectId, {
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        subjectGrade: t.subjectGrade,
        topics: [],
      });
    }
    map.get(t.subjectId)!.topics.push({
      subjectId: t.subjectId,
      topic: t.topic,
      count: t.count,
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName, 'ru')
  );
}

export default function NewTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [mode, setMode] = useState<'MANUAL' | 'BANK_CUSTOM'>('MANUAL');

  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    timeLimit: 15,
    attemptsAllowed: 1,
    published: true,
  });

  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  const [bankConfig, setBankConfig] = useState({
    picks: [] as BankPick[],
    count: 10,
    difficulty: 0,
    types: [] as QuestionType[],
  });

  const [bankStats, setBankStats] = useState<{
    bySubject: any[];
    topics: BankTopic[];
    total: number;
  } | null>(null);

  const [bankPreview, setBankPreview] = useState<Question[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/teacher/subjects').then((r) => r.json()),
      fetch('/api/teacher/topics').then((r) => r.json()),
      fetch('/api/teacher/questions/stats').then((r) => r.json()),
    ])
      .then(([subjectsData, topicsData, statsData]) => {
        setSubjects(subjectsData);
        setTopics(topicsData);
        setBankStats(statsData);
        if (subjectsData.length > 0 && !form.subjectId) {
          setForm((f) => ({ ...f, subjectId: subjectsData[0].id }));
        }
      })
      .catch(() => toast.error('Не удалось загрузить данные'));
  }, []);

  const availableTopics = topics.filter((t) => t.subjectId === form.subjectId);

  const totalInSelectedPicks = bankConfig.picks.reduce((sum, pick) => {
    const t = bankStats?.topics.find(
      (b) => b.subjectId === pick.subjectId && b.topic === pick.topic
    );
    return sum + (t?.count || 0);
  }, 0);

  // === MANUAL ===
  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const removeQuestion = (i: number) => {
    if (questions.length === 1) return toast.error('Хотя бы 1 вопрос');
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, patch: Partial<Question>) => {
    const next = [...questions];
    next[i] = { ...next[i], ...patch };
    setQuestions(next);
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    const next = [...questions];
    next[qi].options[oi] = val;
    setQuestions(next);
  };

  const addOption = (qi: number) => {
    const next = [...questions];
    next[qi].options.push('');
    setQuestions(next);
  };

  const removeOption = (qi: number, oi: number) => {
    const next = [...questions];
    if (next[qi].options.length <= 2) return toast.error('Минимум 2');
    next[qi].options = next[qi].options.filter((_, idx) => idx !== oi);
    if (next[qi].correct >= next[qi].options.length) next[qi].correct = 0;
    next[qi].correctMulti = next[qi].correctMulti
      .filter((x) => x !== oi)
      .map((x) => (x > oi ? x - 1 : x));
    setQuestions(next);
  };

  const toggleMultiCorrect = (qi: number, oi: number) => {
    const next = [...questions];
    const arr = next[qi].correctMulti;
    next[qi].correctMulti = arr.includes(oi)
      ? arr.filter((x) => x !== oi)
      : [...arr, oi].sort((a, b) => a - b);
    setQuestions(next);
  };

  // === BANK ===
  const loadPreview = async () => {
    if (bankConfig.picks.length === 0) {
      return toast.error('Выбери хотя бы одну тему');
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/teacher/questions?limit=500`);
      const all = await res.json();

      let filtered = all.filter((q: any) =>
        bankConfig.picks.some(
          (p) => p.subjectId === q.subjectId && p.topic === q.topic
        )
      );

      if (bankConfig.difficulty)
        filtered = filtered.filter(
          (q: any) => q.difficulty === bankConfig.difficulty
        );

      if (bankConfig.types.length > 0)
        filtered = filtered.filter((q: any) =>
          bankConfig.types.includes(q.type)
        );

      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, bankConfig.count);

      setBankPreview(
        selected.map((q: any) => ({
          bankId: q.id,
          type: q.type,
          text: q.text,
          imageUrl: q.imageUrl || '',
          options: q.options || [],
          correct: q.correct ?? 0,
          correctMulti: q.correctMulti || [],
          correctText: q.correctText || '',
          textMatchMode: q.matchMode || 'CONTAINS',
          correctNumber: q.correctNumber?.toString() || '',
          tolerance: q.tolerance?.toString() || '0.01',
          correctBool: q.correctBool ?? null,
          points: q.points || 1,
          subjectName: q.subject?.name,
        }))
      );

      if (selected.length < bankConfig.count) {
        toast.error(
          `Подходящих только ${selected.length}, а нужно ${bankConfig.count}`
        );
      } else {
        toast.success(`Собрано ${selected.length} вопросов`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Введи название');
    if (mode === 'MANUAL' && !form.subjectId)
      return toast.error('Выбери предмет');

    if (mode === 'MANUAL') {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) return toast.error(`Вопрос ${i + 1}: пустой`);
        if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTI_CHOICE') {
          if (q.options.some((o) => !o.trim()))
            return toast.error(`Вопрос ${i + 1}: заполни варианты`);
          if (q.type === 'MULTI_CHOICE' && q.correctMulti.length === 0)
            return toast.error(`Вопрос ${i + 1}: отметь правильные`);
        }
        if (q.type === 'TEXT' && !q.correctText.trim())
          return toast.error(`Вопрос ${i + 1}: укажи ответ`);
        if (q.type === 'NUMBER' && !q.correctNumber.trim())
          return toast.error(`Вопрос ${i + 1}: укажи число`);
        if (q.type === 'TRUE_FALSE' && q.correctBool === null)
          return toast.error(`Вопрос ${i + 1}: выбери Правда/Ложь`);
      }
    }

    if (mode === 'BANK_CUSTOM') {
      if (bankConfig.picks.length === 0)
        return toast.error('Выбери хотя бы одну тему');
      if (bankPreview.length === 0)
        return toast.error('Нажми «Собрать»');
    }

    setLoading(true);
    try {
      const payload: any = {
        title: form.title,
        subjectId: form.subjectId || null,
        topicId: form.topicId || null,
        mode,
        timeLimit: form.timeLimit,
        attemptsAllowed: form.attemptsAllowed,
        published: form.published,
      };

      if (mode === 'MANUAL') {
        payload.questions = questions.map((q, i) => ({
          id: `q${i + 1}`,
          type: q.type,
          text: q.text,
          imageUrl: q.imageUrl || null,
          points: q.points,
          ...(q.type === 'SINGLE_CHOICE' && {
            options: q.options,
            correct: q.correct,
          }),
          ...(q.type === 'MULTI_CHOICE' && {
            options: q.options,
            correctMulti: q.correctMulti,
          }),
          ...(q.type === 'TEXT' && {
            correctText: q.correctText,
            matchMode: q.textMatchMode,
          }),
          ...(q.type === 'NUMBER' && {
            correctNumber: parseFloat(q.correctNumber.replace(',', '.')),
            tolerance: parseFloat(q.tolerance.replace(',', '.')) || 0.01,
          }),
          ...(q.type === 'TRUE_FALSE' && {
            correctBool: q.correctBool,
          }),
        }));
      } else {
        payload.bankConfig = {
          picks: bankConfig.picks,
          count: bankConfig.count,
          difficulty: bankConfig.difficulty || null,
          types: bankConfig.types.length > 0 ? bankConfig.types : null,
        };
      }

      const res = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Тест создан');
      router.push('/teacher/content');
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
        href="/teacher/content"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к контенту
      </Link>

      <h1 className="text-3xl font-bold text-white mb-1">Новый тест</h1>
      <p className="text-slate-400 mb-6">
        Вручную или автоматически из банка заданий
      </p>

      <form onSubmit={submit} className="space-y-5">
        {/* Переключатель режима */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setMode('MANUAL')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition',
              mode === 'MANUAL'
                ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <PenSquare className="h-4 w-4" />
            Вручную
          </button>
          <button
            type="button"
            onClick={() => setMode('BANK_CUSTOM')}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition',
              mode === 'BANK_CUSTOM'
                ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Wand2 className="h-4 w-4" />
            Из банка заданий
          </button>
        </div>

        {/* Название */}
        <div>
          <Label className="text-slate-300">Название теста</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Например: Подготовка к ОГЭ — вариант 1"
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>

        {/* Предмет + тема — только для MANUAL */}
        {mode === 'MANUAL' && (
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
                <option value="">— Выбери —</option>
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
        )}

        {/* Время и попытки */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Время (мин)</Label>
            <Input
              type="number"
              min={1}
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
              min={1}
              max={10}
              value={form.attemptsAllowed}
              onChange={(e) =>
                setForm({ ...form, attemptsAllowed: Number(e.target.value) })
              }
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* === MANUAL UI === */}
        {mode === 'MANUAL' && (
          <div className="space-y-4">
            <AnimatePresence>
              {questions.map((q, qi) => (
                <motion.div
                  key={qi}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-purple-300 font-semibold">
                      Вопрос {qi + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Тип вопроса */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => {
                      const Icon = TYPE_LABELS[t].icon;
                      const active = q.type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateQuestion(qi, { type: t })}
                          className={cn(
                            'flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] font-medium transition',
                            active
                              ? 'bg-purple-500/20 border-purple-500/50 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {TYPE_LABELS[t].label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Текст */}
                  <Input
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(qi, { text: e.target.value })
                    }
                    placeholder="Текст вопроса (можно $x^2$)"
                    className="mb-3 bg-white/5 border-white/10 text-white"
                  />

                  {/* Картинка */}
                  <div className="mb-3">
                    <ImageUploader
                      label="Картинка"
                      value={q.imageUrl}
                      onChange={(url) => updateQuestion(qi, { imageUrl: url })}
                    />
                  </div>

                  {/* SINGLE / MULTI */}
                  {(q.type === 'SINGLE_CHOICE' ||
                    q.type === 'MULTI_CHOICE') && (
                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, oi) => {
                        const isCorrect =
                          q.type === 'SINGLE_CHOICE'
                            ? q.correct === oi
                            : q.correctMulti.includes(oi);
                        return (
                          <div key={oi} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                q.type === 'SINGLE_CHOICE'
                                  ? updateQuestion(qi, { correct: oi })
                                  : toggleMultiCorrect(qi, oi)
                              }
                              className={cn(
                                'w-8 h-8 flex items-center justify-center flex-shrink-0 transition',
                                q.type === 'SINGLE_CHOICE'
                                  ? 'rounded-full border'
                                  : 'rounded-md border',
                                isCorrect
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-white/20 text-slate-400'
                              )}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-xs font-bold">
                                  {String.fromCharCode(65 + oi)}
                                </span>
                              )}
                            </button>
                            <Input
                              value={opt}
                              onChange={(e) =>
                                updateOption(qi, oi, e.target.value)
                              }
                              placeholder={`Вариант ${String.fromCharCode(65 + oi)}`}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(qi, oi)}
                              disabled={q.options.length <= 2}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => addOption(qi)}
                        className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Добавить вариант
                      </button>
                    </div>
                  )}

                  {/* TEXT */}
                  {q.type === 'TEXT' && (
                    <div className="grid md:grid-cols-2 gap-3 mb-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <Input
                        value={q.correctText}
                        onChange={(e) =>
                          updateQuestion(qi, { correctText: e.target.value })
                        }
                        placeholder="Правильный ответ"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <select
                        value={q.textMatchMode}
                        onChange={(e) =>
                          updateQuestion(qi, {
                            textMatchMode: e.target.value as any,
                          })
                        }
                        className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2"
                      >
                        <option value="CONTAINS">Содержит</option>
                        <option value="EXACT">Точное</option>
                      </select>
                    </div>
                  )}

                  {/* NUMBER */}
                  {q.type === 'NUMBER' && (
                    <div className="grid md:grid-cols-2 gap-3 mb-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <Input
                        value={q.correctNumber}
                        onChange={(e) =>
                          updateQuestion(qi, { correctNumber: e.target.value })
                        }
                        placeholder="Число, например 42"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input
                        value={q.tolerance}
                        onChange={(e) =>
                          updateQuestion(qi, { tolerance: e.target.value })
                        }
                        placeholder="Погрешность 0.01"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  )}

                  {/* TRUE_FALSE */}
                  {q.type === 'TRUE_FALSE' && (
                    <div className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(qi, { correctBool: true })
                        }
                        className={cn(
                          'py-2.5 rounded-lg border text-sm font-semibold transition',
                          q.correctBool === true
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        )}
                      >
                        ✓ Правда
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(qi, { correctBool: false })
                        }
                        className={cn(
                          'py-2.5 rounded-lg border text-sm font-semibold transition',
                          q.correctBool === false
                            ? 'bg-red-500/20 border-red-500/50 text-red-200'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        )}
                      >
                        ✗ Ложь
                      </button>
                    </div>
                  )}

                  {/* Баллы */}
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-slate-400">Баллов:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={q.points}
                      onChange={(e) =>
                        updateQuestion(qi, { points: Number(e.target.value) })
                      }
                      className="w-20 h-8 bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              type="button"
              onClick={addQuestion}
              variant="outline"
              className="w-full gap-2 border-white/20 text-white hover:bg-white/5"
            >
              <Plus className="h-4 w-4" /> Добавить вопрос
            </Button>
          </div>
        )}

        {/* === BANK UI === */}
        {mode === 'BANK_CUSTOM' && (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">
                  Автосборка из банка
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                💡 Можно выбирать темы из разных классов и предметов — например,
                задачи ОГЭ за 7, 8 и 9 класс вместе
              </p>

              {!bankStats || bankStats.topics.length === 0 ? (
                <p className="text-sm text-amber-400">
                  В банке ещё нет вопросов. Создай их на странице «Банк
                  заданий».
                </p>
              ) : (
                <>
                  {/* Группировка тем по предметам */}
                  <div className="space-y-4 mb-4">
                    {groupTopicsBySubject(bankStats.topics).map((group) => {
                      const selectedInGroup = group.topics.filter((t) =>
                        bankConfig.picks.some(
                          (p) =>
                            p.subjectId === t.subjectId && p.topic === t.topic
                        )
                      ).length;

                      return (
                        <div
                          key={group.subjectId}
                          className="rounded-xl bg-slate-950/50 border border-white/10 overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {group.subjectName}
                              </span>
                              {group.subjectGrade && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">
                                  {group.subjectGrade} класс
                                </span>
                              )}
                              <span className="text-xs text-slate-500">
                                ({group.topics.length} тем)
                              </span>
                            </div>
                            {selectedInGroup > 0 && (
                              <span className="text-xs text-emerald-400">
                                ✓ {selectedInGroup}
                              </span>
                            )}
                          </div>

                          <div className="p-3 flex flex-wrap gap-2">
                            {group.topics.map((t) => {
                              const active = bankConfig.picks.some(
                                (p) =>
                                  p.subjectId === t.subjectId &&
                                  p.topic === t.topic
                              );
                              return (
                                <button
                                  key={t.topic}
                                  type="button"
                                  onClick={() =>
                                    setBankConfig({
                                      ...bankConfig,
                                      picks: active
                                        ? bankConfig.picks.filter(
                                            (p) =>
                                              !(
                                                p.subjectId === t.subjectId &&
                                                p.topic === t.topic
                                              )
                                          )
                                        : [
                                            ...bankConfig.picks,
                                            {
                                              subjectId: t.subjectId,
                                              topic: t.topic,
                                            },
                                          ],
                                    })
                                  }
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs border transition',
                                    active
                                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                                  )}
                                >
                                  {t.topic}{' '}
                                  <span
                                    className={cn(
                                      active
                                        ? 'text-purple-200'
                                        : 'text-slate-500'
                                    )}
                                  >
                                    ({t.count})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Итого */}
                  <div className="flex items-center gap-3 mb-4 text-sm">
                    <span className="text-slate-400">
                      Выбрано тем:{' '}
                      <span className="text-white font-semibold">
                        {bankConfig.picks.length}
                      </span>
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">
                      Всего вопросов в выбранных:{' '}
                      <span className="text-white font-semibold">
                        {totalInSelectedPicks}
                      </span>
                    </span>
                  </div>

                  {/* Параметры */}
                  <div className="grid md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Кол-во вопросов
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={bankConfig.count}
                        onChange={(e) =>
                          setBankConfig({
                            ...bankConfig,
                            count: Number(e.target.value),
                          })
                        }
                        className="mt-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs">
                        Сложность
                      </Label>
                      <select
                        value={bankConfig.difficulty}
                        onChange={(e) =>
                          setBankConfig({
                            ...bankConfig,
                            difficulty: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
                      >
                        <option value={0}>Любая</option>
                        <option value={1}>Легко</option>
                        <option value={2}>Средне</option>
                        <option value={3}>Сложно</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={loadPreview}
                        disabled={
                          previewLoading || bankConfig.picks.length === 0
                        }
                        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50"
                      >
                        {previewLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        {bankPreview.length > 0 ? 'Пересобрать' : 'Собрать'}
                      </Button>
                    </div>
                  </div>

                  {/* Типы вопросов */}
                  <div className="mb-4">
                    <Label className="text-slate-300 text-xs mb-2 block">
                      Типы вопросов (если не выбрано — любые)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => {
                        const active = bankConfig.types.includes(t);
                        const Icon = TYPE_LABELS[t].icon;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setBankConfig({
                                ...bankConfig,
                                types: active
                                  ? bankConfig.types.filter((x) => x !== t)
                                  : [...bankConfig.types, t],
                              })
                            }
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition',
                              active
                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {TYPE_LABELS[t].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Превью */}
              {bankPreview.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-sm text-white font-semibold mb-3">
                    Собрано вопросов: {bankPreview.length}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {bankPreview.map((q, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-950/50 border border-white/10 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-purple-300 font-bold flex-shrink-0">
                            {i + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-300 line-clamp-2">
                              {q.text}
                            </div>
                            {q.subjectName && (
                              <div className="text-[10px] text-purple-400 mt-1">
                                {q.subjectName}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 flex-shrink-0">
                            {TYPE_LABELS[q.type].label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 accent-purple-500"
          />
          <span className="text-sm text-slate-200">Опубликовать сразу</span>
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
          {loading ? 'Сохранение...' : 'Сохранить тест'}
        </Button>
      </form>
    </div>
  );
}