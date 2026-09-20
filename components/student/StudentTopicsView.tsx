'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  ChevronDown,
  BookOpen,
  FileText,
  ClipboardList,
  ArrowRight,
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
  notes: { id: string; title: string }[];
  tests: { id: string; title: string }[];
  homeworks: { id: string; title: string }[];
};

export function StudentTopicsView({ topics }: { topics: Topic[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const bySubject = new Map<string, { name: string; topics: Topic[] }>();
  topics.forEach((t) => {
    if (!bySubject.has(t.subjectId)) {
      bySubject.set(t.subjectId, { name: t.subjectName, topics: [] });
    }
    bySubject.get(t.subjectId)!.topics.push(t);
  });

  if (topics.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
        <Lock className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>Пока нет тем по твоим предметам</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(bySubject.entries()).map(([subjectId, group]) => {
        const unlockedCount = group.topics.filter((t) => t.isUnlocked).length;

        return (
          <div key={subjectId}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-semibold text-white">{group.name}</h2>
              <span className="text-xs text-slate-500">
                Открыто: {unlockedCount} из {group.topics.length}
              </span>
            </div>

            <div className="space-y-2">
              {group.topics.map((topic) => {
                const isOpen = openId === topic.id;
                const totalItems =
                  topic.notes.length + topic.tests.length + topic.homeworks.length;

                return (
                  <motion.div
                    key={topic.id}
                    className={cn(
                      'backdrop-blur-xl border rounded-2xl overflow-hidden transition',
                      topic.isUnlocked
                        ? 'bg-white/5 border-white/10 hover:border-purple-500/30'
                        : 'bg-white/5 border-white/10 opacity-60'
                    )}
                  >
                    <button
                      onClick={() =>
                        topic.isUnlocked && setOpenId(isOpen ? null : topic.id)
                      }
                      disabled={!topic.isUnlocked}
                      className={cn(
                        'w-full flex items-center gap-4 p-5 text-left transition',
                        topic.isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2.5 rounded-xl flex-shrink-0',
                          topic.isUnlocked
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                            : 'bg-slate-500/30'
                        )}
                      >
                        {topic.isUnlocked ? (
                          <Unlock className="h-5 w-5 text-white" />
                        ) : (
                          <Lock className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="text-white font-semibold">{topic.title}</h3>
                          {!topic.isUnlocked && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-400">
                              Закрыто учителем
                            </span>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-sm text-slate-400 truncate">
                            {topic.description}
                          </p>
                        )}
                        {topic.isUnlocked && totalItems > 0 && (
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            {topic.notes.length > 0 && (
                              <span>{topic.notes.length} конспектов</span>
                            )}
                            {topic.tests.length > 0 && (
                              <span>{topic.tests.length} тестов</span>
                            )}
                            {topic.homeworks.length > 0 && (
                              <span>{topic.homeworks.length} ДЗ</span>
                            )}
                          </div>
                        )}
                      </div>

                      {topic.isUnlocked && totalItems > 0 && (
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 text-slate-500 transition-transform flex-shrink-0',
                            isOpen && 'rotate-180'
                          )}
                        />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && topic.isUnlocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 border-t border-white/5 space-y-2">
                            {topic.notes.map((n) => (
                              <Link
                                key={n.id}
                                href={`/student/notes`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition"
                              >
                                <BookOpen className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm text-slate-200 flex-1 truncate">
                                  {n.title}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                              </Link>
                            ))}
                            {topic.tests.map((t) => (
                              <Link
                                key={t.id}
                                href={`/student/tests/${t.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition"
                              >
                                <FileText className="h-4 w-4 text-blue-400" />
                                <span className="text-sm text-slate-200 flex-1 truncate">
                                  {t.title}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                              </Link>
                            ))}
                            {topic.homeworks.map((h) => (
                              <Link
                                key={h.id}
                                href={`/student/homework/${h.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-amber-500/30 transition"
                              >
                                <ClipboardList className="h-4 w-4 text-amber-400" />
                                <span className="text-sm text-slate-200 flex-1 truncate">
                                  {h.title}
                                </span>
                                <ArrowRight className="h-3 w-3 text-slate-500" />
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}