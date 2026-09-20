'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  Loader2,
  Clock,
  User as UserIcon,
  FileText,
  MessageSquare,
} from 'lucide-react';

type Request = {
  id: string;
  status: string;
  reason: string | null;
  createdAt: string;
  user: { id: string; name: string; grade: number | null; email: string };
  test: { id: string; title: string; subjectName: string };
};

export function RetakeRequestsList({ initial }: { initial: Request[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const handle = async (
    id: string,
    action: 'APPROVED' | 'REJECTED',
    teacherNote?: string
  ) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/teacher/retakes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, teacherNote }),
      });
      if (!res.ok) throw new Error('Ошибка');
      toast.success(action === 'APPROVED' ? 'Пересдача одобрена' : 'Отклонено');
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setNoteFor(null);
      setNote('');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
        <Check className="h-12 w-12 mx-auto mb-4 opacity-30" />
        Все запросы обработаны 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {requests.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {r.user.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="text-white font-semibold mb-1">
                  {r.user.name}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {r.user.grade ? `${r.user.grade} класс` : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {r.test.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                    {r.test.subjectName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(r.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>

                {r.reason && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {r.reason}
                  </div>
                )}

                {noteFor === r.id && (
                  <div className="mt-3">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Комментарий для ученика (необязательно)"
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-lg p-2 text-xs resize-y focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handle(r.id, 'APPROVED', note)}
                  disabled={loading === r.id}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {loading === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Одобрить
                </Button>
                <Button
                  onClick={() => {
                    if (noteFor === r.id) {
                      handle(r.id, 'REJECTED', note);
                    } else {
                      setNoteFor(r.id);
                    }
                  }}
                  disabled={loading === r.id}
                  variant="outline"
                  className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                  {noteFor === r.id ? 'Подтвердить отказ' : 'Отклонить'}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}