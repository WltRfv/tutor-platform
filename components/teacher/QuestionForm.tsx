'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CheckSquare,
  AlignLeft,
  Hash,
  ToggleLeft,
} from 'lucide-react';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { cn } from '@/lib/utils';
import type { QuestionItem } from './QuestionsList';

type Subject = { id: string; name: string; category: string; grade: number | null };

type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'TEXT'
  | 'NUMBER'
  | 'TRUE_FALSE';

const TYPE_OPTIONS: { id: QuestionType; label: string; icon: any }[] = [
  { id: 'SINGLE_CHOICE', label: 'Один вариант', icon: Circle },
  { id: 'MULTI_CHOICE', label: 'Несколько', icon: CheckSquare },
  { id: 'TEXT', label: 'Текст', icon: AlignLeft },
  { id: 'NUMBER', label: 'Число', icon: Hash },
  { id: 'TRUE_FALSE', label: 'Правда/Ложь', icon: ToggleLeft },
];

export function QuestionForm({
  subjects,
  question,
  onSaved,
  onCancel,
}: {
  subjects: Subject[];
  question: QuestionItem | null;
  onSaved: (q: QuestionItem) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subjectId: question?.subjectId || subjects[0]?.id || '',
    topic: question?.topic || '',
    difficulty: question?.difficulty || 2,
    type: (question?.type || 'SINGLE_CHOICE') as QuestionType,
    text: question?.text || '',
    imageUrl: question?.imageUrl || '',
    options: (question?.options as string[]) || ['', '', '', ''],
    correct: question?.correct ?? 0,
    correctMulti: (question?.correctMulti as number[]) || [],
    correctText: question?.correctText || '',
    matchMode: (question?.matchMode as 'CONTAINS' | 'EXACT') || 'CONTAINS',
    correctNumber: question?.correctNumber?.toString() || '',
    tolerance: question?.tolerance?.toString() || '0.01',
    correctBool: question?.correctBool ?? null,
    explanation: question?.explanation || '',
    points: question?.points || 1,
  });

  const update = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const addOption = () => update({ options: [...form.options, ''] });

  const removeOption = (i: number) => {
    if (form.options.length <= 2) return toast.error('Минимум 2 варианта');
    const opts = form.options.filter((_, idx) => idx !== i);
    const newCorrect = form.correct >= opts.length ? 0 : form.correct;
    const newMulti = form.correctMulti
      .filter((idx) => idx !== i)
      .map((idx) => (idx > i ? idx - 1 : idx));
    update({ options: opts, correct: newCorrect, correctMulti: newMulti });
  };

  const setOption = (i: number, val: string) => {
    const opts = [...form.options];
    opts[i] = val;
    update({ options: opts });
  };

  const toggleMulti = (i: number) => {
    const arr = form.correctMulti.includes(i)
      ? form.correctMulti.filter((x) => x !== i)
      : [...form.correctMulti, i].sort((a, b) => a - b);
    update({ correctMulti: arr });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) return toast.error('Выбери предмет');
    if (!form.topic.trim()) return toast.error('Введи тему');
    if (!form.text.trim()) return toast.error('Введи текст вопроса');

    if (form.type === 'SINGLE_CHOICE' || form.type === 'MULTI_CHOICE') {
      if (form.options.some((o) => !o.trim()))
        return toast.error('Заполни все варианты');
      if (form.type === 'MULTI_CHOICE' && form.correctMulti.length === 0)
        return toast.error('Отметь правильные варианты');
    }
    if (form.type === 'TEXT' && !form.correctText.trim())
      return toast.error('Укажи правильный ответ');
    if (form.type === 'NUMBER') {
      if (!form.correctNumber.trim()) return toast.error('Укажи число');
      if (isNaN(parseFloat(form.correctNumber.replace(',', '.'))))
        return toast.error('Некорректное число');
    }
    if (form.type === 'TRUE_FALSE' && form.correctBool === null)
      return toast.error('Выбери Правда/Ложь');

    setLoading(true);
    try {
      const payload = {
        subjectId: form.subjectId,
        topic: form.topic.trim(),
        difficulty: form.difficulty,
        type: form.type,
        text: form.text.trim(),
        imageUrl: form.imageUrl || null,
        options:
          form.type === 'SINGLE_CHOICE' || form.type === 'MULTI_CHOICE'
            ? form.options
            : null,
        correct: form.type === 'SINGLE_CHOICE' ? form.correct : null,
        correctMulti: form.type === 'MULTI_CHOICE' ? form.correctMulti : null,
        correctText: form.type === 'TEXT' ? form.correctText : null,
        matchMode: form.type === 'TEXT' ? form.matchMode : null,
        correctNumber:
          form.type === 'NUMBER'
            ? parseFloat(form.correctNumber.replace(',', '.'))
            : null,
        tolerance:
          form.type === 'NUMBER'
            ? parseFloat(form.tolerance.replace(',', '.')) || 0.01
            : null,
        correctBool: form.type === 'TRUE_FALSE' ? form.correctBool : null,
        explanation: form.explanation || null,
        points: form.points,
      };

      const url = question
        ? `/api/teacher/questions/${question.id}`
        : '/api/teacher/questions';
      const method = question ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const saved: QuestionItem = {
        id: data.question.id,
        subjectId: data.question.subjectId,
        subjectName:
          subjects.find((s) => s.id === data.question.subjectId)?.name || '',
        topic: data.question.topic,
        difficulty: data.question.difficulty,
        type: data.question.type,
        text: data.question.text,
        imageUrl: data.question.imageUrl,
        options: data.question.options,
        correct: data.question.correct,
        correctMulti: data.question.correctMulti,
        correctText: data.question.correctText,
        matchMode: data.question.matchMode,
        correctNumber: data.question.correctNumber,
        tolerance: data.question.tolerance,
        correctBool: data.question.correctBool,
        explanation: data.question.explanation,
        points: data.question.points,
        source: data.question.source,
        createdAt: data.question.createdAt,
      };

      toast.success(question ? 'Вопрос обновлён' : 'Вопрос создан');
      onSaved(saved);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="backdrop-blur-xl bg-white/5 border border-purple-500/30 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">
          {question ? 'Редактировать вопрос' : 'Новый вопрос'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label className="text-slate-300">Предмет</Label>
          <select
            value={form.subjectId}
            onChange={(e) => update({ subjectId: e.target.value })}
            className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            required
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-slate-300">Тема</Label>
          <Input
            value={form.topic}
            onChange={(e) => update({ topic: e.target.value })}
            placeholder="Например: Квадратные уравнения"
            className="mt-2 bg-white/5 border-white/10 text-white"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label className="text-slate-300">Сложность</Label>
          <select
            value={form.difficulty}
            onChange={(e) => update({ difficulty: Number(e.target.value) })}
            className="mt-2 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
          >
            <option value={1}>Легко</option>
            <option value={2}>Средне</option>
            <option value={3}>Сложно</option>
          </select>
        </div>
        <div>
          <Label className="text-slate-300">Баллы</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={form.points}
            onChange={(e) => update({ points: Number(e.target.value) })}
            className="mt-2 bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>

      <div className="mb-4">
        <Label className="text-slate-300 mb-2 block">Тип вопроса</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {TYPE_OPTIONS.map((t) => {
            const Icon = t.icon;
            const active = form.type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ type: t.id })}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-[11px] font-medium transition',
                  active
                    ? 'bg-purple-500/20 border-purple-500/50 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-center leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <Label className="text-slate-300">Текст вопроса</Label>
        <textarea
          value={form.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Текст вопроса (можно $x^2$)"
          rows={3}
          className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-purple-500/50"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          💡 Формулы: <code className="text-purple-300">$x^2$</code> или{' '}
          <code className="text-purple-300">$$...$$</code>
        </p>
      </div>

      <div className="mb-4">
        <ImageUploader
          label="Картинка (необязательно)"
          value={form.imageUrl}
          onChange={(url) => update({ imageUrl: url })}
        />
      </div>

      {/* SINGLE / MULTI */}
      {(form.type === 'SINGLE_CHOICE' || form.type === 'MULTI_CHOICE') && (
        <div className="space-y-2 mb-4">
          {form.options.map((opt, i) => {
            const isCorrect =
              form.type === 'SINGLE_CHOICE'
                ? form.correct === i
                : form.correctMulti.includes(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    form.type === 'SINGLE_CHOICE'
                      ? update({ correct: i })
                      : toggleMulti(i)
                  }
                  className={cn(
                    'w-8 h-8 flex items-center justify-center flex-shrink-0 transition',
                    form.type === 'SINGLE_CHOICE'
                      ? 'rounded-full border'
                      : 'rounded-md border',
                    isCorrect
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-white/20 text-slate-400 hover:border-emerald-500/50'
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                  )}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Вариант ${String.fromCharCode(65 + i)}`}
                  className="bg-white/5 border-white/10 text-white"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={form.options.length <= 2}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2"
          >
            <Plus className="h-3 w-3" /> Добавить вариант
          </button>
        </div>
      )}

      {/* TEXT */}
      {form.type === 'TEXT' && (
        <div className="space-y-3 mb-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div>
            <Label className="text-slate-300 text-xs">Правильный ответ</Label>
            <Input
              value={form.correctText}
              onChange={(e) => update({ correctText: e.target.value })}
              placeholder="Например: Париж"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Как проверять?</Label>
            <select
              value={form.matchMode}
              onChange={(e) => update({ matchMode: e.target.value as any })}
              className="mt-1 w-full bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            >
              <option value="CONTAINS">Содержит слово (гибко)</option>
              <option value="EXACT">Точное совпадение</option>
            </select>
          </div>
        </div>
      )}

      {/* NUMBER */}
      {form.type === 'NUMBER' && (
        <div className="grid md:grid-cols-2 gap-3 mb-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div>
            <Label className="text-slate-300 text-xs">Правильное число</Label>
            <Input
              value={form.correctNumber}
              onChange={(e) => update({ correctNumber: e.target.value })}
              placeholder="42"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Погрешность (±)</Label>
            <Input
              value={form.tolerance}
              onChange={(e) => update({ tolerance: e.target.value })}
              placeholder="0.01"
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>
      )}

      {/* TRUE_FALSE */}
      {form.type === 'TRUE_FALSE' && (
        <div className="mb-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <Label className="text-slate-300 text-xs mb-2 block">
            Правильный ответ
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update({ correctBool: true })}
              className={cn(
                'py-3 rounded-lg border text-sm font-semibold transition',
                form.correctBool === true
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              )}
            >
              ✓ Правда
            </button>
            <button
              type="button"
              onClick={() => update({ correctBool: false })}
              className={cn(
                'py-3 rounded-lg border text-sm font-semibold transition',
                form.correctBool === false
                  ? 'bg-red-500/20 border-red-500/50 text-red-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              )}
            >
              ✗ Ложь
            </button>
          </div>
        </div>
      )}

      {/* Пояснение */}
      <div className="mb-4">
        <Label className="text-slate-300">
          Объяснение (показывается после ответа)
        </Label>
        <textarea
          value={form.explanation}
          onChange={(e) => update({ explanation: e.target.value })}
          rows={2}
          placeholder="Почему этот ответ правильный..."
          className="mt-2 w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm resize-y focus:outline-none focus:border-purple-500/50"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Сохранение...' : question ? 'Сохранить' : 'Создать'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-white/20 text-slate-300 hover:bg-white/5"
        >
          Отмена
        </Button>
      </div>
    </form>
  );
}