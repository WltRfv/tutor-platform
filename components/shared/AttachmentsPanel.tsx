'use client';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Trash2, Pencil, Check, X, Upload, Image as ImageIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Attachment = {
  id: string;
  name: string;
  url: string;
  mime: string | null;
  size: number | null;
  createdAt: string;
};

type Props = {
  noteId?: string;
  testId?: string;
  homeworkId?: string;
  lessonPlanId?: string;
  onInsert: (markdown: string) => void;
};

export function AttachmentsPanel(props: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (props.noteId) qs.set('noteId', props.noteId);
      if (props.testId) qs.set('testId', props.testId);
      if (props.homeworkId) qs.set('homeworkId', props.homeworkId);
      if (props.lessonPlanId) qs.set('lessonPlanId', props.lessonPlanId);
      const res = await fetch(`/api/teacher/attachments?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.noteId, props.testId, props.homeworkId, props.lessonPlanId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл больше 10 МБ');
      return;
    }
    setUploading(true);
    try {
      // 1) Грузим в Supabase Storage
      const fd = new FormData();
      fd.append('file', file);
      const upRes = await fetch('/api/teacher/upload-image', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error);

      // 2) Создаём запись Attachment
      const attRes = await fetch('/api/teacher/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          url: upData.url,
          mime: file.type,
          size: file.size,
          noteId: props.noteId || null,
          testId: props.testId || null,
          homeworkId: props.homeworkId || null,
          lessonPlanId: props.lessonPlanId || null,
        }),
      });
      const attData = await attRes.json();
      if (!attRes.ok) throw new Error(attData.error);

      setItems((prev) => [attData.attachment, ...prev]);
      toast.success('Загружено');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить файл из списка? Сам файл в хранилище останется.')) return;
    try {
      const res = await fetch(`/api/teacher/attachments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка');
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast.success('Удалено');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const rename = async (id: string) => {
    if (!editName.trim()) return setEditingId(null);
    try {
      const res = await fetch(`/api/teacher/attachments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => prev.map((a) => (a.id === id ? data.attachment : a)));
      toast.success('Переименовано');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEditingId(null);
    }
  };

  const insert = (a: Attachment) => {
    const isImage = (a.mime || '').startsWith('image/');
    const md = isImage
      ? `\n![${a.name}](${a.url})\n`
      : `\n[${a.name}](${a.url})\n`;
    props.onInsert(md);
  };

  const onDragStart = (e: React.DragEvent, a: Attachment) => {
    const isImage = (a.mime || '').startsWith('image/');
    const md = isImage ? `![${a.name}](${a.url})` : `[${a.name}](${a.url})`;
    e.dataTransfer.setData('text/markdown-attachment', md);
    e.dataTransfer.setData('text/plain', md);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-white">Мои файлы</div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs text-white transition disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Загрузить
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={onUpload}
        />
      </div>

      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
        Перетащи файл прямо в текст или нажми «+», чтобы вставить в позицию курсора.
      </p>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="text-center py-6 text-slate-500 text-xs">Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Пока нет файлов
          </div>
        ) : (
          items.map((a) => {
            const isImage = (a.mime || '').startsWith('image/');
            const isEditing = editingId === a.id;
            return (
              <div
                key={a.id}
                draggable={!isEditing}
                onDragStart={(e) => onDragStart(e, a)}
                className={cn(
                  'group relative rounded-xl border border-white/10 bg-white/5 p-2 transition',
                  !isEditing && 'cursor-grab active:cursor-grabbing hover:border-purple-500/40'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950/60 flex items-center justify-center flex-shrink-0">
                    {isImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={a.url}
                        alt={a.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-1 items-center">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') rename(a.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="flex-1 bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => rename(a.id)}
                          className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-slate-400 hover:bg-white/5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-white truncate" title={a.name}>
                        {a.name}
                      </div>
                    )}
                    {!isEditing && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isImage ? 'Изображение' : 'Файл'}
                        {a.size ? ` · ${Math.round(a.size / 1024)} КБ` : ''}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => insert(a)}
                        title="Вставить в текст"
                        className="p-1 rounded text-purple-400 hover:bg-purple-500/10"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(a.id);
                          setEditName(a.name);
                        }}
                        title="Переименовать"
                        className="p-1 rounded text-slate-400 hover:bg-white/5"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(a.id)}
                        title="Удалить"
                        className="p-1 rounded text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}