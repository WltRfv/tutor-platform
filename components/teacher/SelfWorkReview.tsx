'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Clock,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Student = {
  id: string;
  name: string;
  email: string;
  status: string;
  studentAnswer: string | null;
  teacherComment: string | null;
};

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Не начал', color: 'text-slate-400', icon: Clock },
  SUBMITTED: { label: 'Ждёт проверки', color: 'text-amber-400', icon: Send },
  PASSED: { label: 'Зачтено', color: 'text-emerald-400', icon: CheckCircle2 },
  FAILED: { label: 'Не зачтено', color: 'text-red-400', icon: XCircle },
};

export function SelfWorkReview({
  noteId,
  students,
}: {
  noteId: string;
  students: Student[];
}) {
  const [items, setItems] = useState(students);
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});

  const setStatus = async (
    userId: string,
    status: 'PASSED' | 'FAILED' | 'PENDING'
  ) => {
    setBusy(userId);
    try {
      const res = await fetch(`/api/teacher/notes/${noteId}/selfwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, comment: comment[userId] || null }),
      });
      if (!res.ok) throw new Error('Ошибка');
      setItems((prev) =>
        prev.map((s) =>
          s.id === userId
            ? {
                ...s,
                status,
                teacherComment: comment[userId] || null,
              }
            : s
        )
      );
      toast.success(
        status === 'PASSED'
          ? 'Зачтено'
          : status === 'FAILED'
          ? 'Не зачтено'
          : 'Сброшено'
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">
          Проверка самостоятельной ({items.length})
        </h3>
      </div>

      <div className="space-y-2">
        {items.map((s) => {
          const st = STATUS[s.status] || STATUS.PENDING;
          const Icon = st.icon;
          const isOpen = openId === s.id;
          const hasAnswer = !!s.studentAnswer?.trim();

          return (
            <div
              key={s.id}
              className={cn(
                'rounded-xl border transition',
                s.status === 'SUBMITTED'
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : s.status === 'PASSED'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : s.status === 'FAILED'
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : s.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                    s.status === 'SUBMITTED'
                      ? 'bg-amber-500/20'
                      : s.status === 'PASSED'
                      ? 'bg-emerald-500/20'
                      : s.status === 'FAILED'
                      ? 'bg-red-500/20'
                      : 'bg-slate-500/20'
                  )}
                >
                  <Icon className={cn('h-4 w-4', st.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {s.name}
                  </div>
                  <div className={cn('text-xs', st.color)}>{st.label}</div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-500 transition-transform flex-shrink-0',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                  {hasAnswer ? (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-white/10">
                      <div className="text-[10px] text-slate-500 mb-1">
                        Ответ ученика:
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap">
                        {s.studentAnswer}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Ученик ещё не отправил работу
                    </p>
                  )}

                  <input
                    value={comment[s.id] ?? ''}
                    onChange={(e) =>
                      setComment({ ...comment, [s.id]: e.target.value })
                    }
                    placeholder="Комментарий (по желанию)"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus(s.id, 'PASSED')}
                      disabled={busy === s.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-200 text-xs font-medium transition disabled:opacity-50"
                    >
                      {busy === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Зачесть
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(s.id, 'FAILED')}
                      disabled={busy === s.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 text-xs font-medium transition disabled:opacity-50"
                    >
                      {busy === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Не зачесть
                    </button>
                    {s.status !== 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => setStatus(s.id, 'PENDING')}
                        disabled={busy === s.id}
                        className="px-3 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white text-xs transition disabled:opacity-50"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}