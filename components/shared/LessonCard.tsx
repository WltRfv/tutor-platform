'use client';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  CheckCircle2,
  PenTool,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Lesson = {
  id: string;
  title: string | null;
  subject: { name: string } | string;
  startAt: Date | string;
  endAt: Date | string;
  telemostLink: string | null;
  boardLink: string | null;
  status: string;
};

export function LessonCard({
  lesson,
  role,
  past = false,
}: {
  lesson: Lesson;
  role: 'student' | 'teacher';
  past?: boolean;
}) {
  const start = new Date(lesson.startAt);
  const end = new Date(lesson.endAt);
  const now = new Date();
  const isLive = start <= now && end >= now;

  const subjectName =
    typeof lesson.subject === 'string'
      ? lesson.subject
      : lesson.subject?.name || 'Занятие';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative group backdrop-blur-xl bg-white/5 border rounded-2xl p-5 transition',
        isLive
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-white/10 hover:border-purple-500/30'
      )}
    >
      {isLive && (
        <div className="absolute -top-2 left-5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Сейчас идёт
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={cn(
            'p-3 rounded-2xl flex-shrink-0 shadow-lg',
            isLive
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
              : 'bg-gradient-to-br from-purple-500 to-blue-500'
          )}
        >
          <Calendar className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white font-semibold">
              {lesson.title || 'Занятие'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
              {subjectName}
            </span>
            {lesson.status === 'COMPLETED' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Проведено
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {start.toLocaleDateString('ru-RU', {
                weekday: 'short',
                day: '2-digit',
                month: 'long',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {start.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              —{' '}
              {end.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {lesson.telemostLink && !past && (
          <a
            href={lesson.telemostLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg',
              isLive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/20'
            )}
          >
            <Video className="h-4 w-4" />
            {isLive ? 'Подключиться' : 'Ссылка на занятие'}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {lesson.boardLink && !past && (
          <a
            href={lesson.boardLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition"
          >
            <PenTool className="h-4 w-4" />
            Доска
          </a>
        )}

        {role === 'teacher' && !past && (
          <Link
            href={`/teacher/calendar/${lesson.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition"
          >
            Изменить
          </Link>
        )}
      </div>
    </motion.div>
  );
}