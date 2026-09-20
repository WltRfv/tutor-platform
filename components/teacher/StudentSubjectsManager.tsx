'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, Plus, X, Loader2, User, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Subject = {
  id: string;
  name: string;
  code: string;
  grade: number | null;
  category: string;
};

type CurrentSubject = {
  userSubjectId: string;
  id: string;
  name: string;
  code: string;
  addedBy: string;
};

export function StudentSubjectsManager({
  studentId,
  currentSubjects,
  allSubjects,
}: {
  studentId: string;
  currentSubjects: CurrentSubject[];
  allSubjects: Subject[];
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState(currentSubjects);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Какие предметы ещё НЕ добавлены
  const currentIds = new Set(subjects.map((s) => s.id));
  const availableSubjects = allSubjects.filter((s) => !currentIds.has(s.id));

  const addSubject = async (subjectId: string) => {
    setLoading(subjectId);
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const subject = allSubjects.find((s) => s.id === subjectId)!;
      setSubjects((prev) => [
        ...prev,
        {
          userSubjectId: data.userSubject.id,
          id: subject.id,
          name: subject.name,
          code: subject.code,
          addedBy: 'TEACHER',
        },
      ]);
      toast.success(`Добавлен предмет: ${subject.name}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const removeSubject = async (subjectId: string) => {
    if (!confirm('Удалить предмет у ученика?')) return;
    setLoading(subjectId);
    try {
      const res = await fetch(
        `/api/teacher/students/${studentId}/subjects/${subjectId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Ошибка удаления');
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      toast.success('Предмет удалён');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Предметы</h2>
            <p className="text-xs text-slate-500">
              Всего: {subjects.length}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-medium transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить
        </button>
      </div>

      {/* Текущие предметы */}
      <div className="flex flex-wrap gap-2 mb-3">
        <AnimatePresence>
          {subjects.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                'group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs',
                s.addedBy === 'TEACHER'
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-200'
                  : 'bg-blue-500/20 border-blue-500/30 text-blue-200'
              )}
            >
              {s.addedBy === 'TEACHER' ? (
                <Wand2 className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              <span>{s.name}</span>
              <button
                onClick={() => removeSubject(s.id)}
                disabled={loading === s.id}
                className="opacity-0 group-hover:opacity-100 transition hover:text-red-400"
              >
                {loading === s.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {subjects.length === 0 && (
          <span className="text-xs text-slate-500">Нет предметов</span>
        )}
      </div>

      {/* Выпадающий список доступных */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-2">Доступные предметы:</p>
              {availableSubjects.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Все предметы уже добавлены
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addSubject(s.id)}
                      disabled={loading === s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-xs text-slate-300 hover:text-white transition"
                    >
                      {loading === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3 text-blue-400" /> выбрал сам
        </span>
        <span className="flex items-center gap-1">
          <Wand2 className="h-3 w-3 text-purple-400" /> добавлено учителем
        </span>
      </div>
    </div>
  );
}
