'use client';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FindErrorItem = {
  id?: string;
  statement: string;
  hasError: boolean;
  correction: string;
  explanation: string;
};

type Props = { items: FindErrorItem[]; onChange: (items: FindErrorItem[]) => void };

export function FindErrorItemsEditor({ items, onChange }: Props) {
  const update = (i: number, patch: Partial<FindErrorItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () =>
    onChange([
      ...items,
      { statement: '', hasError: true, correction: '', explanation: '' },
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-slate-300">Утверждения ({items.length})</Label>
        <button
          type="button"
          onClick={add}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Добавить
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
                  Утверждение {i + 1}
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
                <Label className="text-[11px] text-slate-400">Утверждение</Label>
                <textarea
                  value={it.statement}
                  onChange={(e) => update(i, { statement: e.target.value })}
                  rows={2}
                  placeholder="Квадрат суммы равен сумме квадратов: (a+b)² = a² + b²"
                  className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Label className="text-[11px] text-slate-400">Есть ошибка?</Label>
                <button
                  type="button"
                  onClick={() => update(i, { hasError: true })}
                  className={`px-3 py-1 rounded-lg text-xs transition ${it.hasError ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => update(i, { hasError: false })}
                  className={`px-3 py-1 rounded-lg text-xs transition ${!it.hasError ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                >
                  Нет (ловушка)
                </button>
              </div>
              {it.hasError && (
                <div className="mt-3">
                  <Label className="text-[11px] text-slate-400">
                    Правильный вариант (показываем после ответа)
                  </Label>
                  <textarea
                    value={it.correction}
                    onChange={(e) => update(i, { correction: e.target.value })}
                    rows={2}
                    placeholder="(a+b)² = a² + 2ab + b²"
                    className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              )}
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