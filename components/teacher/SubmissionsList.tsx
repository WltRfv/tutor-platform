'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Palette,
  Type,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

type Submission = {
  id: string;
  version: number;
  status: string;
  previewUrl: string | null;
  files: any;
  textAnswer: string | null;
  gradeEmoji: string | null;
  teacherComment: string | null;
  createdAt: Date | string;
  user: { id: string; name: string; grade: number | null; email: string };
};

export function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  // Группируем по ученику
  const byUser = new Map<string, Submission[]>();
  submissions.forEach((s) => {
    if (!byUser.has(s.user.id)) byUser.set(s.user.id, []);
    byUser.get(s.user.id)!.push(s);
  });

  return (
    <div className="space-y-3">
      {Array.from(byUser.entries()).map(([userId, subs]) => {
        const latest = subs[0];
        const isReviewed = latest.status === 'REVIEWED';
        const needsRevision = latest.status === 'NEEDS_REVISION';

        return (
          <motion.div
            key={userId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`backdrop-blur-xl bg-white/5 border rounded-2xl p-5 hover:border-purple-500/30 transition ${
              isReviewed
                ? 'border-emerald-500/30'
                : needsRevision
                ? 'border-orange-500/30'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {latest.user.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-white font-semibold">{latest.user.name}</h3>
                  {latest.user.grade && (
                    <span className="text-xs text-slate-500">
                      {latest.user.grade} класс
                    </span>
                  )}
                  {isReviewed && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Проверено
                    </span>
                  )}
                  {needsRevision && (
                    <span className="flex items-center gap-1 text-xs text-orange-400">
                      <AlertTriangle className="h-3 w-3" /> На доработку
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    v{latest.version} · {subs.length} версий
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {latest.previewUrl && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 flex items-center gap-1">
                      <Palette className="h-3 w-3" /> Доска
                    </span>
                  )}
                  {latest.files &&
                    Array.isArray(latest.files) &&
                    latest.files.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {latest.files.length} файл(ов)
                      </span>
                    )}
                  {latest.textAnswer && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 flex items-center gap-1">
                      <Type className="h-3 w-3" /> Текст
                    </span>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(latest.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {latest.gradeEmoji && (
                  <span className="text-3xl leading-none flex-shrink-0">
                    {latest.gradeEmoji}
                  </span>
                )}
                <Link
                  href={`/teacher/homework/submission/${latest.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
                >
                  <Eye className="h-4 w-4" />
                  Открыть
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}