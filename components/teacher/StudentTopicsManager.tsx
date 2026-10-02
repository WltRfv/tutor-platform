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
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopicContentPicker } from './TopicContentPicker';

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
  selectedCount: number | null; // null если контент не выбран (всё доступно), число если выбраны конкретные
};

export function StudentTopicsManager({
  studentId,
  studentName,
  initialTopics,
}: {
  studentId: string;
  studentName: string;
  initialTopics: Topic[];
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [loading, setLoading] = useState<string | null>(null);
  const [picker, setPicker] = useState<Topic | null>(null);

  const bySubject = new Map<string, { name: string; topics: Topic[] }>();
  topics.forEach((t) => {
    if (!bySubject.has(t.subjectId)) {
      bySubject.set(t.subjectId, { name: t.subjectName, topics: [] });
    }
    bySubject.get(t.subjectId)!.topics.push(t);
  });

  const closeTopic = async (topic: Topic) => {
    if (!confirm(`Закрыть тему «${topic.title}» для ученика?`)) return;
    setLoading(topic.id);
    try {
      const res = await fetch(`/api/teacher/topics/${topic.id}/unlock`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId }),
      });
      if (!res.ok) throw new Error('Ошибка');
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? { ...t, isUnlocked: false, unlockedAt: null, selectedCount: null }
            : t
        )
      );
      toast.success(`Закрыто: ${topic.title}`);
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
    <>
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Темы</h2>
            <p className="text-xs text-slate-500">
              Клик по теме — открыть или настроить, что именно видит ученик
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
                {group.topics.map((t) => {
                  const total =
                    t.counts.notes + t.counts.tests + t.counts.homeworks;
                  const isBusy = loading === t.id;

                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition',
                        t.isUnlocked
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-white/5 border-white/10'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setPicker(t)}
                        disabled={isBusy}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:opacity-50"
                      >
                        <div
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            t.isUnlocked ? 'bg-emerald-500/20' : 'bg-slate-500/20'
                          )}
                        >
                          {isBusy ? (
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
                            {total > 0 && (
                              <span className="text-slate-600">
                                всего {total}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Статус */}
                      <div
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0',
                          t.isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-500/20 text-slate-400'
                        )}
                      >
                        {t.isUnlocked ? (
                          t.selectedCount === null ? (
                            'Всё'
                          ) : (
                            `${t.selectedCount}/${total}`
                          )
                        ) : (
                          'Закрыта'
                        )}
                      </div>

                      {/* Кнопка закрыть */}
                      {t.isUnlocked && (
                        <button
                          type="button"
                          onClick={() => closeTopic(t)}
                          disabled={isBusy}
                          title="Закрыть тему"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {picker && (
        <TopicContentPicker
          topicId={picker.id}
          topicTitle={picker.title}
          userId={studentId}
          userName={studentName}
          isUnlocked={picker.isUnlocked}
          onClose={() => setPicker(null)}
          onSaved={({ selectedContentIds }) => {
            setTopics((prev) =>
              prev.map((t) =>
                t.id === picker.id
                  ? {
                      ...t,
                      isUnlocked: true,
                      unlockedAt: new Date().toISOString(),
                      selectedCount: selectedContentIds
                        ? selectedContentIds.length
                        : null,
                    }
                  : t
              )
            );
          }}
        />
      )}
    </>
  );
}