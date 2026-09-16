'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Check, X, Mail, Phone, GraduationCap, Loader2, Clock } from 'lucide-react';

type App = {
  id: string;
  name: string;
  email: string;
  grade: number | null;
  phone: string | null;
  subjects: string[];
  createdAt: Date | string;
};

const SUBJECT_LABELS: Record<string, string> = {
  MATH_5_6: 'Математика 5–6',
  ALGEBRA_7_9: 'Алгебра 7–9',
  GEOMETRY_7_9: 'Геометрия 7–9',
  OGE_PREP: 'ОГЭ',
  VPR_PREP: 'ВПР',
  INFORMATICS: 'Информатика',
};

export function ApplicationsList({ initial }: { initial: App[] }) {
  const [apps, setApps] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const handle = async (id: string, action: 'approve' | 'reject') => {
    setLoading(id);
    try {
      const res = await fetch(`/api/teacher/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Ошибка при обработке');
      toast.success(action === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена');
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  if (apps.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <Check className="h-12 w-12 mx-auto mb-4 opacity-30" />
        Все заявки обработаны 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {apps.map((app) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition" />
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition">
              <div className="flex justify-between items-start gap-6 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <h3 className="text-lg font-semibold text-white mb-2">{app.name}</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> {app.email}
                    </span>
                    {app.phone && (
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {app.phone}
                      </span>
                    )}
                    {app.grade && (
                      <span className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> {app.grade} класс
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {app.subjects.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-200 text-xs"
                      >
                        {SUBJECT_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handle(app.id, 'approve')}
                    disabled={loading === app.id}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {loading === app.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Одобрить
                  </Button>
                  <Button
                    onClick={() => handle(app.id, 'reject')}
                    disabled={loading === app.id}
                    variant="outline"
                    className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                    Отклонить
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}