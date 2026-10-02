'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  BookOpen,
  FileText,
  ClipboardList,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = { id: string; title: string };

type Props = {
  topicId: string;
  topicTitle: string;
  userId: string;
  userName: string;
  isUnlocked: boolean;
  onClose: () => void;
  onSaved: (payload: {
    isUnlocked: boolean;
    selectedContentIds: string[] | null;
  }) => void;
};

export function TopicContentPicker({
  topicId,
  topicTitle,
  userId,
  userName,
  isUnlocked,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Item[]>([]);
  const [tests, setTests] = useState<Item[]>([]);
  const [homeworks, setHomeworks] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [wasUnlocked, setWasUnlocked] = useState(false);
  const [wasAll, setWasAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/teacher/topics/${topicId}/content?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setNotes(data.notes || []);
        setTests(data.tests || []);
        setHomeworks(data.homeworks || []);
        setWasUnlocked(!!data.isUnlocked);

        const selectedFromServer = data.selectedContentIds as string[] | null;
        if (selectedFromServer === null) {
          // всё доступно
          setWasAll(true);
          const all = new Set<string>();
          (data.notes || []).forEach((n: Item) => all.add(`note:${n.id}`));
          (data.tests || []).forEach((t: Item) => all.add(`test:${t.id}`));
          (data.homeworks || []).forEach((h: Item) => all.add(`homework:${h.id}`));
          setSelected(all);
        } else {
          setWasAll(false);
          setSelected(new Set(selectedFromServer));
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, userId]);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const selectAll = () => {
    const all = new Set<string>();
    notes.forEach((n) => all.add(`note:${n.id}`));
    tests.forEach((t) => all.add(`test:${t.id}`));
    homeworks.forEach((h) => all.add(`homework:${h.id}`));
    setSelected(all);
  };

  const clearAll = () => setSelected(new Set());

  const save = async () => {
    // Если тема уже была открыта как «всё доступно» и учитель ничего не менял — оставляем null
    const contentIds = Array.from(selected);

    setSaving(true);
    try {
      if (!wasUnlocked) {
        const res = await fetch(`/api/teacher/topics/${topicId}/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, contentIds }),
        });
        if (!res.ok) throw new Error('Ошибка открытия');
      } else {
        const res = await fetch(`/api/teacher/topics/${topicId}/unlock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, contentIds }),
        });
        if (!res.ok) throw new Error('Ошибка сохранения');
      }

      toast.success(wasUnlocked ? 'Доступ обновлён' : 'Тема открыта');
      onSaved({ isUnlocked: true, selectedContentIds: contentIds });
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalAvailable = notes.length + tests.length + homeworks.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col"
        >
          {/* Шапка */}
          <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'p-3 rounded-2xl flex-shrink-0',
                  wasUnlocked
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                )}
              >
                {wasUnlocked ? (
                  <Unlock className="h-5 w-5 text-white" />
                ) : (
                  <Lock className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {wasUnlocked ? 'Настроить доступ' : 'Открыть тему'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {topicTitle} · для {userName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Контент */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : totalAvailable === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">В этой теме пока нет материалов</p>
                <p className="text-xs mt-1">
                  Добавь конспекты, тесты или ДЗ — и привяжи их к этой теме
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-400">
                    Отметь, что именно показывать ученику. Неотмеченное будет
                    скрыто, пока тему не переоткроют.
                  </p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={selectAll}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Все
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      onClick={clearAll}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Ничего
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Конспекты */}
                  {notes.length > 0 && (
                    <Section
                      icon={<BookOpen className="h-4 w-4 text-emerald-400" />}
                      title={`Конспекты (${notes.length})`}
                    >
                      {notes.map((n) => (
                        <Row
                          key={n.id}
                          label={n.title}
                          checked={selected.has(`note:${n.id}`)}
                          onToggle={() => toggle(`note:${n.id}`)}
                        />
                      ))}
                    </Section>
                  )}

                  {/* Тесты */}
                  {tests.length > 0 && (
                    <Section
                      icon={<FileText className="h-4 w-4 text-blue-400" />}
                      title={`Тесты (${tests.length})`}
                    >
                      {tests.map((t) => (
                        <Row
                          key={t.id}
                          label={t.title}
                          checked={selected.has(`test:${t.id}`)}
                          onToggle={() => toggle(`test:${t.id}`)}
                        />
                      ))}
                    </Section>
                  )}

                  {/* ДЗ */}
                  {homeworks.length > 0 && (
                    <Section
                      icon={<ClipboardList className="h-4 w-4 text-amber-400" />}
                      title={`Домашние задания (${homeworks.length})`}
                    >
                      {homeworks.map((h) => (
                        <Row
                          key={h.id}
                          label={h.title}
                          checked={selected.has(`homework:${h.id}`)}
                          onToggle={() => toggle(`homework:${h.id}`)}
                        />
                      ))}
                    </Section>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Футер */}
          <div className="p-6 border-t border-white/5 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-slate-400">
              Отмечено материалов:{' '}
              <span className="text-white font-semibold">{selected.size}</span>
              {totalAvailable > 0 ? ` из ${totalAvailable}` : ''}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition text-sm"
              >
                Отмена
              </button>
              <button
                onClick={save}
                disabled={saving || loading}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50',
                  wasUnlocked
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                )}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin inline-block" />
                ) : wasUnlocked ? (
                  'Сохранить'
                ) : (
                  'Открыть тему'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition',
        checked
          ? 'bg-purple-500/10 border-purple-500/40'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      )}
    >
      {checked ? (
        <CheckSquare className="h-4 w-4 text-purple-400 flex-shrink-0" />
      ) : (
        <Square className="h-4 w-4 text-slate-500 flex-shrink-0" />
      )}
      <span className="text-sm text-slate-200 truncate flex-1">{label}</span>
    </button>
  );
}