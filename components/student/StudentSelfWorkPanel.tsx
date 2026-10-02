'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle2, XCircle, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StudentSelfWorkPanel({
  noteId,
  initialStatus,
  initialAnswer,
  teacherComment,
}: {
  noteId: string;
  initialStatus: string;
  initialAnswer: string;
  teacherComment: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [answer, setAnswer] = useState(initialAnswer);
  const [comment, setComment] = useState(teacherComment);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!answer.trim()) return toast.error('Напиши свой ответ');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/notes/${noteId}/selfwork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('SUBMITTED');
      setComment(null);
      toast.success('Отправлено на проверку');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = status === 'PENDING' || status === 'SUBMITTED' || status === 'FAILED';

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Моя работа</h3>
        <StatusPill status={status} />
      </div>

      {status === 'PASSED' ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-sm text-emerald-200 font-medium">
              ✅ Работа зачтена
            </div>
            {comment && (
              <div className="text-xs text-emerald-300 mt-1">
                Комментарий: {comment}
              </div>
            )}
          </div>
          {answer && (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-white/10">
              <div className="text-[10px] text-slate-500 mb-1">Твой ответ:</div>
              <div className="text-sm text-slate-200 whitespace-pre-wrap">{answer}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {status === 'SUBMITTED' && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
              Отправлено на проверку. Дождись ответа учителя.
            </div>
          )}
          {status === 'FAILED' && comment && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-sm text-red-200 font-medium">❌ Не зачтено</div>
              <div className="text-xs text-red-300 mt-1">
                Комментарий: {comment}
              </div>
            </div>
          )}

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Напиши решение / ответ здесь"
            rows={8}
            disabled={!canEdit}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50 disabled:opacity-60"
          />

          {canEdit && (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {status === 'PENDING' ? 'Отправить на проверку' : 'Отправить повторно'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    PENDING: { label: 'Не отправлено', cls: 'bg-slate-500/20 text-slate-300', icon: Clock },
    SUBMITTED: { label: 'На проверке', cls: 'bg-amber-500/20 text-amber-300', icon: Send },
    PASSED: { label: 'Зачтено', cls: 'bg-emerald-500/20 text-emerald-300', icon: CheckCircle2 },
    FAILED: { label: 'Не зачтено', cls: 'bg-red-500/20 text-red-300', icon: XCircle },
  };
  const item = map[status] || map.PENDING;
  const Icon = item.icon;
  return (
    <span className={cn('ml-auto text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1', item.cls)}>
      <Icon className="h-3 w-3" />
      {item.label}
    </span>
  );
}