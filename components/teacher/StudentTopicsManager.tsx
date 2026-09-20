'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Layers,
  Lock,
  Unlock,
  Loader2,
  BookOpen,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Topic = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  subjectId: string;
  subjectName: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  counts: { notes: number; tests: number; homeworks: number };
};

export function StudentTopicsManager({
  studentId,
  initialTopics,
}: {
  studentId: string;
  initialTopics: Topic[];
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [loading, setLoading] = useState<string | null>(null);

  const bySubject = new Map<string, { name: string; topics: Topic[] }>();
  topics.forEach((t) => {
    if (!bySubject.has(t.subjectId)) {
      bySubject.set(t.subjectId, { name: t.subjectName, topics: [] });
    }
    bySubject.get(t.subjectId)!.topics.push(t);
  });

  const toggle = async (topic: Topic) => {
    setLoading(topic.id);
    try {
      const method = topic.isUnlocked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/teacher/topics/${topic.id}/unlock`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId }),
      });
      if (!res.ok) throw new Error('Ошибка');
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? {
                ...t,
                isUnlocked: !t.isUnlocked,
                unlockedAt: !t.isUnlocked ? new Date().toISOString() : null,
              }
            : t
        )
      );
      toast.success(
        topic.isUnlocked ? `Закрыто: ${topic.title}` : `Открыто: ${topic.title}`
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  if (topics.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Темы</h2>
        </div>
        <p className="text-sm text-slate-500 text-center py-4">
          Ученику ещё не назначены предметы с темами
        </p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Темы</h2>
          <p className="text-xs text-slate-500">
            Кликни, чтобы открыть или закрыть тему для ученика
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {Array.from(bySubject.entries()).map(([subjectId, group]) => (
          <div key={subjectId}>
            <div className="text-xs text-slate-400 font-medium mb-2 px-1">
              {group.name}
            </div>
            <div className="space-y-2">
              {group.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggle(t)}
                  disabled={loading === t.id}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition text-left',
                    t.isUnlocked
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      t.isUnlocked ? 'bg-emerald-500/20' : 'bg-slate-500/20'
                    )}
                  >
                    {loading === t.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : t.isUnlocked ? (
                      <Unlock className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {t.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {t.counts.notes > 0 && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {t.counts.notes}
                        </span>
                      )}
                      {t.counts.tests > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {t.counts.tests}
                        </span>
                      )}
                      {t.counts.homeworks > 0 && (
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" /> {t.counts.homeworks}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0',
                      t.isUnlocked
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-500/20 text-slate-400'
                    )}
                  >
                    {t.isUnlocked ? 'Открыта' : 'Закрыта'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}