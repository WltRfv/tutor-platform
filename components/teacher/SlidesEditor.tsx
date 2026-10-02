'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  GripVertical,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type SlideDraft = {
  id?: string;
  title: string;
  content: string;
  imageUrl: string;
};

export function SlidesEditor({
  slides,
  onChange,
}: {
  slides: SlideDraft[];
  onChange: (next: SlideDraft[]) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const add = () => {
    onChange([...slides, { title: '', content: '', imageUrl: '' }]);
    setCollapsed(new Set([...collapsed, slides.length]));
  };

  const remove = (i: number) => {
    if (slides.length === 1) return toast.error('Минимум 1 слайд');
    if (!confirm(`Удалить слайд ${i + 1}?`)) return;
    onChange(slides.filter((_, idx) => idx !== i));
    setCollapsed(new Set());
  };

  const duplicate = (i: number) => {
    const copy = { ...slides[i] };
    delete copy.id;
    const next = [...slides];
    next.splice(i + 1, 0, copy);
    onChange(next);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setCollapsed(new Set());
  };

  const update = (i: number, patch: Partial<SlideDraft>) => {
    const next = [...slides];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const toggleCollapse = (i: number) => {
    const next = new Set(collapsed);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setCollapsed(next);
  };

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {slides.map((s, i) => {
          const isCollapsed = collapsed.has(i);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="rounded-2xl bg-slate-950/50 border border-white/10 overflow-hidden"
            >
              <div className="p-3 flex items-center gap-2 border-b border-white/5">
                <GripVertical className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-shrink-0">
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
                    disabled={i === slides.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleCollapse(i)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-purple-300">
                    Слайд {i + 1}
                  </div>
                  {s.title && (
                    <div className="text-sm text-white truncate">{s.title}</div>
                  )}
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => duplicate(i)}
                    title="Дублировать"
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    title="Удалить"
                    className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Заголовок слайда (опционально)
                    </label>
                    <Input
                      value={s.title}
                      onChange={(e) => update(i, { title: e.target.value })}
                      placeholder="Например: Что такое таблица"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Содержимое слайда
                    </label>
                    <MarkdownEditor
                      value={s.content}
                      onChange={(v) => update(i, { content: v })}
                      placeholder="Markdown, формулы, картинки, таблицы..."
                      rows={8}
                    />
                  </div>

                  <div>
                    <ImageUploader
                      label="Картинка слайда (необязательно)"
                      value={s.imageUrl}
                      onChange={(url) => update(i, { imageUrl: url })}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/40 hover:bg-white/5 text-slate-400 hover:text-white text-sm font-medium transition flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Добавить слайд
      </button>
    </div>
  );
}