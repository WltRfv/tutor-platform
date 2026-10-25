'use client';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type MatchingItem = {
  id?: string;
  left: string;
  right: string;
};

type Props = {
  items: MatchingItem[];
  onChange: (items: MatchingItem[]) => void;
};

export function MatchingItemsEditor({ items, onChange }: Props) {
  const update = (i: number, patch: Partial<MatchingItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const add = () => onChange([...items, { left: '', right: '' }]);

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
        <Label className="text-slate-300">Пары ({items.length})</Label>
        <button
          type="button"
          onClick={add}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Добавить пару
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
                  Пара {i + 1}
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

              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-slate-400">
                    Левая часть (вопрос)
                  </Label>
                  <textarea
                    value={it.left}
                    onChange={(e) => update(i, { left: e.target.value })}
                    rows={2}
                    placeholder="x² − 9"
                    className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-400">
                    Правая часть (ответ)
                  </Label>
                  <textarea
                    value={it.right}
                    onChange={(e) => update(i, { right: e.target.value })}
                    rows={2}
                    placeholder="(x − 3)(x + 3)"
                    className="mt-1 w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm resize-y focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}