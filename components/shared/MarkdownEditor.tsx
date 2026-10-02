'use client';
import { useRef, useState } from 'react';
import { MathText } from './MathText';
import { AttachmentsPanel } from './AttachmentsPanel';
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
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  noteId?: string;
  testId?: string;
  homeworkId?: string;
  lessonPlanId?: string;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 18,
  noteId,
  testId,
  homeworkId,
  lessonPlanId,
}: Props) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
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

      // Параллельно создаём запись вложения, если есть привязка к документу
      if (noteId || testId || homeworkId || lessonPlanId) {
        await fetch('/api/teacher/attachments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            url: data.url,
            mime: file.type,
            size: file.size,
            noteId: noteId || null,
            testId: testId || null,
            homeworkId: homeworkId || null,
            lessonPlanId: lessonPlanId || null,
          }),
        });
      }

      insertLine(`![${file.name}](${data.url})`);
      toast.success('Картинка вставлена');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const md =
      e.dataTransfer.getData('text/markdown-attachment') ||
      e.dataTransfer.getData('text/plain');
    if (!md || !md.match(/^(!?\[.*?\]\(.*?\))$/)) return;

    e.preventDefault();
    const el = textareaRef.current;
    if (!el) {
      onChange(value + '\n' + md + '\n');
      return;
    }
    const start = el.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const payload =
      (before && !before.endsWith('\n') ? '\n' : '') +
      md +
      (after.startsWith('\n') ? '' : '\n');
    onChange(before + payload + after);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + payload.length;
    });
  };

  const showPanel = !!(noteId || testId || homeworkId || lessonPlanId);

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

        <div className="flex flex-wrap gap-1">
          {tab === 'edit' && (
            <>
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
            </>
          )}
          {showPanel && (
            <button
              type="button"
              title={panelOpen ? 'Скрыть панель файлов' : 'Показать панель файлов'}
              onClick={() => setPanelOpen((v) => !v)}
              className={cn(
                'p-1.5 rounded-lg border transition',
                panelOpen
                  ? 'border-purple-500/50 bg-purple-500/15 text-white'
                  : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          'grid gap-3',
          showPanel && panelOpen ? 'lg:grid-cols-[1fr_260px]' : 'grid-cols-1'
        )}
      >
        <div>
          {tab === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onDrop={onDrop}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('text/markdown-attachment')) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }
              }}
              placeholder={placeholder}
              rows={rows}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50 leading-relaxed"
            />
          ) : (
            <div className="min-h-[200px] bg-white/5 border border-white/10 rounded-xl p-4">
              {value.trim() ? (
                <MathText className="text-slate-300 leading-relaxed">{value}</MathText>
              ) : (
                <p className="text-slate-500 text-sm">Пока пусто</p>
              )}
            </div>
          )}
        </div>

        {showPanel && panelOpen && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 lg:sticky lg:top-4 lg:max-h-[600px] lg:overflow-hidden flex flex-col">
            <AttachmentsPanel
              noteId={noteId}
              testId={testId}
              homeworkId={homeworkId}
              lessonPlanId={lessonPlanId}
              onInsert={(md) => insertLine(md.trim())}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        💡 Формулы: <code className="text-purple-300">$x^2$</code> — инлайн,{' '}
        <code className="text-purple-300">$$...$$</code> — блок. Картинки:{' '}
        <code className="text-purple-300">![alt](url)</code>. Таблицы, списки, код — как в markdown.
        {showPanel && ' Перетаскивай файлы из панели прямо в текст.'}
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