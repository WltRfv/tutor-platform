'use client';
import { useRef, useState } from 'react';
import { MathText } from './MathText';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image as ImageIcon,
  Table2,
  Sigma,
  SquareFunction,
  Code,
  Eye,
  PenSquare,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
};

export function MarkdownEditor({ value, onChange, placeholder, rows = 18 }: Props) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const wrap = (before: string, after: string = before) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + before + after);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = selected
        ? start + before.length + selected.length + after.length
        : start + before.length;
      el.selectionStart = el.selectionEnd = pos;
    });
  };

  const insertLine = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + '\n' + text + '\n');
      return;
    }
    const start = el.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const needsNl = before && !before.endsWith('\n');
    const payload = (needsNl ? '\n' : '') + text + (after.startsWith('\n') ? '' : '\n');
    onChange(before + payload + after);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + payload.length;
    });
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Только изображения');
    if (file.size > 5 * 1024 * 1024) return toast.error('Максимум 5 МБ');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/teacher/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      insertLine(`![${file.name}](${data.url})`);
      toast.success('Картинка вставлена');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition',
              tab === 'edit' ? 'bg-purple-500/30 text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            <PenSquare className="h-3.5 w-3.5" />
            Писать
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition',
              tab === 'preview' ? 'bg-purple-500/30 text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Просмотр
          </button>
        </div>

        {tab === 'edit' && (
          <div className="flex flex-wrap gap-1">
            <Btn title="Жирный" icon={Bold} onClick={() => wrap('**')} />
            <Btn title="Курсив" icon={Italic} onClick={() => wrap('*')} />
            <Btn title="Заголовок 1" icon={Heading1} onClick={() => insertLine('# ')} />
            <Btn title="Заголовок 2" icon={Heading2} onClick={() => insertLine('## ')} />
            <Btn title="Список" icon={List} onClick={() => insertLine('- ')} />
            <Btn title="Нумерованный" icon={ListOrdered} onClick={() => insertLine('1. ')} />
            <Btn title="Код" icon={Code} onClick={() => insertLine('```\n\n```')} />
            <Btn title="Формула" icon={Sigma} onClick={() => wrap('$')} />
            <Btn title="Блок формулы" icon={SquareFunction} onClick={() => insertLine('$$\n\n$$')} />
            <Btn
              title="Таблица"
              icon={Table2}
              onClick={() => insertLine('| Заголовок | Заголовок |\n|---|---|\n|  |  |')}
            />
            <button
              type="button"
              title="Картинка"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </div>
        )}
      </div>

      <div className={tab === 'edit' ? '' : 'hidden'}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50 leading-relaxed"
        />
      </div>

      {tab === 'preview' && (
        <div className="min-h-[200px] bg-white/5 border border-white/10 rounded-xl p-4">
          {value.trim() ? (
            <MathText className="text-slate-300 leading-relaxed">{value}</MathText>
          ) : (
            <p className="text-slate-500 text-sm">Пока пусто</p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">
        💡 Формулы: <code className="text-purple-300">$x^2$</code> — инлайн,{' '}
        <code className="text-purple-300">$$...$$</code> — блок. Картинки:{' '}
        <code className="text-purple-300">![alt](url)</code>. Таблицы, списки, код — как в markdown.
      </p>
    </div>
  );
}

function Btn({ title, icon: Icon, onClick }: { title: string; icon: any; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}