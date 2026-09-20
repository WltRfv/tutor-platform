'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { TestRunner } from './TestRunner';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trophy,
  History,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RetakeRequestModal } from './RetakeRequestModal';
import { cn } from '@/lib/utils';

type Test = {
  id: string;
  title: string;
  subjectName: string;
  timeLimit: number | null;
  attemptsAllowed: number;
  questions: any[];
};

type Submission = {
  id: string;
  version: number;
  score: number | null;
  createdAt: string;
};

type RetakeRequest = {
  id: string;
  status: string;
  reason: string | null;
  teacherNote: string | null;
  createdAt: string;
};

export function TestPageClient({
  test,
  submissions,
  retakeRequests,
  hasApprovedRetake,
}: {
  test: Test;
  submissions: Submission[];
  retakeRequests: RetakeRequest[];
  hasApprovedRetake: boolean;
}) {
  const [started, setStarted] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  const attemptsUsed = submissions.length;
  const attemptsAllowed = test.attemptsAllowed;
  const canAttempt = attemptsUsed < attemptsAllowed || hasApprovedRetake;
  const bestScore = submissions.length
    ? Math.max(...submissions.map((s) => s.score || 0))
    : null;

  const lastRequest = retakeRequests[0];

  // === Если уже начал — показываем сам тест ===
  if (started) {
    return <TestRunner test={test} />;
  }

  return (
    <div className="p-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 mb-6"
      >
        <h1 className="text-3xl font-bold text-white mb-3">{test.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-6">
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
            {test.subjectName}
          </span>
          <span className="flex items-center gap-1">
            📝 Вопросов: {test.questions.length}
          </span>
          {test.timeLimit && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {test.timeLimit} мин
            </span>
          )}
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Попыток: {attemptsUsed} из{' '}
            {attemptsAllowed}
          </span>
        </div>

        {/* Результаты */}
        {submissions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">
                Твои результаты
              </span>
            </div>
            <div className="space-y-2">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-xs text-slate-500 min-w-[40px]">
                    v{s.version}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      (s.score || 0) >= 80
                        ? 'text-emerald-400'
                        : (s.score || 0) >= 50
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    )}
                  >
                    {s.score}%
                  </span>
                </div>
              ))}
            </div>
            {bestScore !== null && (
              <div className="mt-3 text-sm text-slate-400">
                Лучший результат:{' '}
                <span className="text-emerald-400 font-bold">{bestScore}%</span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Статус пересдачи */}
      {lastRequest && !canAttempt && (
        <div
          className={cn(
            'backdrop-blur-xl border rounded-2xl p-5 mb-6',
            lastRequest.status === 'PENDING'
              ? 'bg-amber-500/10 border-amber-500/30'
              : lastRequest.status === 'REJECTED'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          )}
        >
          <div className="flex items-start gap-3">
            {lastRequest.status === 'PENDING' ? (
              <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : lastRequest.status === 'REJECTED' ? (
              <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-sm font-semibold text-white mb-1">
                {lastRequest.status === 'PENDING'
                  ? '⏳ Запрос на пересдачу ждёт одобрения'
                  : lastRequest.status === 'REJECTED'
                  ? '❌ Учитель отклонил пересдачу'
                  : '✅ Учитель разрешил пересдачу'}
              </div>
              {lastRequest.teacherNote && (
                <div className="text-xs text-slate-400 mt-1">
                  Ответ учителя: {lastRequest.teacherNote}
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1">
                Запрошено: {new Date(lastRequest.createdAt).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка начала или запрос пересдачи */}
      <div className="space-y-3">
        {canAttempt && (
          <Button
            onClick={() => setStarted(true)}
            className="w-full h-14 gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-lg font-semibold shadow-lg shadow-purple-500/30"
          >
            <Play className="h-5 w-5" />
            {attemptsUsed > 0 ? `Пройти ещё раз (v${attemptsUsed + 1})` : 'Начать тест'}
          </Button>
        )}

        {!canAttempt &&
          (!lastRequest || lastRequest.status === 'REJECTED') && (
            <Button
              onClick={() => setShowRetakeModal(true)}
              className="w-full h-14 gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-lg font-semibold shadow-lg shadow-amber-500/30"
            >
              <RefreshCw className="h-5 w-5" />
              Запросить пересдачу
            </Button>
          )}
      </div>

      {/* Модалка запроса */}
      {showRetakeModal && (
        <RetakeRequestModal
          testId={test.id}
          onClose={() => setShowRetakeModal(false)}
        />
      )}
    </div>
  );
}