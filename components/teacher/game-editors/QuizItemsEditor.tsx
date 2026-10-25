'use client';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type QuizItem = {
  id?: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
};

type Props = { items: QuizItem[]; onChange: (items: QuizItem[]) => void };

export function QuizItemsEditor({ items, onChange }: Props) {
  const update = (i: number, patch: Partial<QuizItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () =>
    onChange([
      ...items,
      { text: '', options: ['', '', '', ''], correct: 0, explanation: '' },
    ]);
  const remove = (i: number) => {
    if (items.length === 1) return;
    onChange(items.filter((_, idx) => idx !== i));
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  const updateOpt = (i: number, oi: number, val: string) => {
    const next = [...items];
    const opts = [...next[i].options];
    opts[oi] = val;
    next[i] = { ...next[i], options: opts };
    onChange(next);
  };
  const addOpt = (i: number) => {
    const next = [...items];
    next[i] = { ...next[i], options: [...next[i].options, ''] };
    onChange(next);
  };
  const removeOpt = (i: number, oi: number) => {
    if (items[i].options.length <= 2) return;
    const next = [...items];
    const opts = next[i].options.filter((_, idx) => idx !== oi);
    let correct = next[i].correct;
    if (correct === oi) correct = 0;
    else if (correct > oi) correct = correct - 1;
    next[i] = { ...next[i], options: opts, correct };
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-slate-300">Вопросы ({items.length})</Label>
        <button
          type="button"
          onClick={add}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Добавить вопрос
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
                  Вопрос {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === items.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={items.length === 1}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-slate-400">Текст вопроса</Label>
                <textarea
                  value={it.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                  rows={2}
                  placeholder="Чему равен дискриминант?"
                  className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[11px] text-slate-400">
                    Варианты ответа ({it.options.length}) — отметь верный
                  </Label>
                  <button
                    type="button"
                    onClick={() => addOpt(i)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Вариант
                  </button>
                </div>
                <div className="space-y-1.5">
                  {it.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`flex items-center gap-2 rounded-lg border p-2 transition ${it.correct === oi ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
                    >
                      <button
                        type="button"
                        onClick={() => update(i, { correct: oi })}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${it.correct === oi ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}
                      >
                        {it.correct === oi ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-xs">{oi + 1}</span>
                        )}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => updateOpt(i, oi, e.target.value)}
                        placeholder={`Вариант ${oi + 1}`}
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeOpt(i, oi)}
                        disabled={it.options.length <= 2}
                        className="p-1 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-[11px] text-slate-400">Пояснение (необязательно)</Label>
                <textarea
                  value={it.explanation}
                  onChange={(e) => update(i, { explanation: e.target.value })}
                  rows={2}
                  className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}