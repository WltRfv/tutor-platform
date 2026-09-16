'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link2, Save, Loader2, ExternalLink, X } from 'lucide-react';

export function MessengerLinkEditor({
  studentId,
  initialLink,
}: {
  studentId: string;
  initialLink: string | null;
}) {
  const [link, setLink] = useState(initialLink || '');
  const [saved, setSaved] = useState(initialLink || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messengerLink: link }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      const data = await res.json();
      setSaved(data.messengerLink || '');
      setLink(data.messengerLink || '');
      setEditing(false);
      toast.success('Ссылка сохранена');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setLink(saved);
    setEditing(false);
  };

  // Если ссылка есть и мы не редактируем — показываем кнопку
  if (saved && !editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={saved}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium transition shadow-lg shadow-purple-500/20"
        >
          <ExternalLink className="h-4 w-4" />
          Открыть чат
        </a>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition"
        >
          <Link2 className="h-4 w-4" />
          Изменить
        </button>
      </div>
    );
  }

  // Форма редактирования
  return (
    <div className="w-full">
      <label className="text-xs text-slate-400 mb-2 block">
        Ссылка на чат в мессенджере (Telegram / VK / WhatsApp)
      </label>
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://t.me/username или https://vk.com/id..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-purple-500/50 placeholder:text-slate-500"
            autoFocus
          />
        </div>
        <button
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Сохранить
        </button>
        {saved && (
          <button
            onClick={cancel}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        💡 Вставь ссылку на личный чат с учеником — потом откроешь в один клик
      </p>
    </div>
  );
}