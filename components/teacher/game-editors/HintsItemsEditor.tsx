'use client';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type HintsItem = {
  id?: string;
  answer: string;
  hints: string[];
};

type Props = {
  items: HintsItem[];
  onChange: (items: HintsItem[]) => void;
};

export function HintsItemsEditor({ items, onChange }: Props) {
  const updateItem = (i: number, patch: Partial<HintsItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([...items, { answer: '', hints: [''] }]);

  const removeItem = (i: number) => {
    if (items.length === 1) return;
    onChange(items.filter((_, idx) => idx !== i));
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  const addHint = (i: number) => {
    const next = [...items];
    next[i] = { ...next[i], hints: [...next[i].hints, ''] };
    onChange(next);
  };

  const updateHint = (i: number, hi: number, value: string) => {
    const next = [...items];
    const hints = [...next[i].hints];
    hints[hi] = value;
    next[i] = { ...next[i], hints };
    onChange(next);
  };

  const removeHint = (i: number, hi: number) => {
    if (items[i].hints.length <= 1) return;
    const next = [...items];
    const hints = next[i].hints.filter((_, idx) => idx !== hi);
    next[i] = { ...next[i], hints };
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-slate-300">Вопросы ({items.length})</Label>
        <button
          type="button"
          onClick={addItem}
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
                    disabled={items.length === 1}
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-slate-400">
                  Правильный ответ
                </Label>
                <textarea
                  value={it.answer}
                  onChange={(e) => updateItem(i, { answer: e.target.value })}
                  rows={2}
                  placeholder="теорема Пифагора"
                  className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[11px] text-slate-400">
                    Подсказки ({it.hints.length}) — от размытой к точной
                  </Label>
                  <button
                    type="button"
                    onClick={() => addHint(i)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Подсказка
                  </button>
                </div>
                <div className="space-y-2">
                  {it.hints.map((h, hi) => (
                    <div key={hi} className="flex items-start gap-2">
                      <span className="text-[10px] text-slate-500 pt-2 w-4 text-right shrink-0">
                        {hi + 1}.
                      </span>
                      <input
                        value={h}
                        onChange={(e) => updateHint(i, hi, e.target.value)}
                        placeholder={
                          hi === 0
                            ? 'Связано с прямоугольным треугольником'
                            : 'Квадрат гипотенузы равен сумме квадратов катетов'
                        }
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => removeHint(i, hi)}
                        disabled={it.hints.length <= 1}
                        className="p-1.5 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}