'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Palette,
  FileText,
  Type,
  Send,
  Loader2,
  History,
  Award,
  MessageSquare,
  AlertTriangle,
  Download,
  X,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MathText } from '@/components/shared/MathText';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Code2 } from 'lucide-react';

type FileItem = {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
};

type TaskAnswerInfo = {
  answer: string;
  passed: boolean | null;
  message: string | null;
};

type Task = {
  id: string;
  order: number;
  text: string;
  imageUrl: string | null;
  hasAutoCheck: boolean;
  answerType: string;
  points: number;
};

type Submission = {
  id: string;
  version: number;
  status: string;
  gradeEmoji: string | null;
  teacherComment: string | null;
  textAnswer: string | null;
  previewUrl: string | null;
  boardData: any;
  files: any;
  taskAnswers: Record<string, TaskAnswerInfo> | null;
  autoScore: number | null;
  autoTotal: number | null;
  createdAt: string;
  user: { id: string; name: string; grade: number | null; email: string };
  homework: {
    id: string;
    title: string;
    description: string | null;
    subjectName: string;
    tasks: Task[];
  };
  aiReview: string | null;
  aiReviewScore: number | null;
  aiReviewedAt: string | null;
  taskCodes: Record<string, string> | null;
};

type Version = {
  id: string;
  version: number;
  status: string;
  gradeEmoji: string | null;
  autoScore: number | null;
  autoTotal: number | null;
  createdAt: string;
  previewUrl: string | null;
};

type Tab = 'tasks' | 'board' | 'files' | 'text';

const EMOJIS = [
  { emoji: '🔥', label: 'Топ' },
  { emoji: '✅', label: 'Хорошо' },
  { emoji: '⚠️', label: 'С замечаниями' },
  { emoji: '❌', label: 'Не принято' },
];

export function SubmissionViewer({
  submission,
  allVersions,
}: {
  submission: Submission;
  allVersions: Version[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('tasks');
  const [comment, setComment] = useState(submission.teacherComment || '');
  const [gradeEmoji, setGradeEmoji] = useState(submission.gradeEmoji || '');
  const [saving, setSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(submission.status);

  const files: FileItem[] = Array.isArray(submission.files)
    ? submission.files
    : [];

  const review = async (status: 'REVIEWED' | 'NEEDS_REVISION') => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/teacher/homework/submission/${submission.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            teacherComment: comment,
            gradeEmoji: gradeEmoji || null,
          }),
        }
      );
      if (!res.ok) throw new Error('Ошибка сохранения');
      toast.success(
        status === 'REVIEWED' ? 'Оценка сохранена' : 'Отправлено на доработку'
      );
      setCurrentStatus(status);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const hasBoard = !!submission.previewUrl;
  const hasFiles = files.length > 0;
  const hasText = !!submission.textAnswer;
  const totalTasks = submission.homework.tasks.length;
  const [aiReview, setAiReview] = useState(submission.aiReview);
  const [aiScore, setAiScore] = useState(submission.aiReviewScore);
  const [aiLoading, setAiLoading] = useState(false);
  const runAICheck = async () => {
    if (!confirm('Запустить проверку через ИИ? Это спишет ~1-3 копейки с баланса DeepSeek.')) return;
    setAiLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/homework/submission/${submission.id}/ai-check`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiReview(data.review);
      setAiScore(data.score);
      toast.success(`ИИ проверил: ${data.score}/100`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Профиль */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {submission.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold text-white mb-1">
              {submission.user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {submission.user.grade && (
                <span>{submission.user.grade} класс</span>
              )}
              <span>{submission.user.email}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Задание</div>
            <div className="text-white font-medium">
              {submission.homework.title}
            </div>
            <div className="text-xs text-purple-300 mt-0.5">
              {submission.homework.subjectName} · {totalTasks} задач
            </div>
          </div>
        </div>

        {submission.homework.description && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-slate-500 mb-1">Условие:</div>
            <MathText className="text-sm text-slate-300 leading-relaxed">
                {submission.homework.description}
            </MathText>
          </div>
        )}
      </div>

      {/* Статус */}
      <div
        className={cn(
          'backdrop-blur-xl border rounded-2xl p-4 flex items-center gap-3',
          currentStatus === 'REVIEWED'
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : currentStatus === 'NEEDS_REVISION'
            ? 'bg-orange-500/10 border-orange-500/30'
            : 'bg-white/5 border-white/10'
        )}
      >
        {currentStatus === 'REVIEWED' ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : currentStatus === 'NEEDS_REVISION' ? (
          <AlertTriangle className="h-5 w-5 text-orange-400" />
        ) : (
          <Send className="h-5 w-5 text-slate-400" />
        )}
        <div className="flex-1">
          <div className="text-sm text-white">
            {currentStatus === 'REVIEWED'
              ? 'Работа проверена'
              : currentStatus === 'NEEDS_REVISION'
              ? 'Отправлено на доработку'
              : 'Ожидает проверки'}
          </div>
          <div className="text-xs text-slate-500">
            Версия v{submission.version} ·{' '}
            {new Date(submission.createdAt).toLocaleString('ru-RU')}
          </div>
        </div>
        {gradeEmoji && <div className="text-3xl leading-none">{gradeEmoji}</div>}
      </div>

      {/* Автопроверка */}
      {submission.autoTotal !== null && submission.autoTotal > 0 && (
        <div
          className={cn(
            'backdrop-blur-xl border rounded-2xl p-5 flex items-center gap-4',
            submission.autoScore === submission.autoTotal
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          )}
        >
          <div
            className={cn(
              'text-2xl font-bold',
              submission.autoScore === submission.autoTotal
                ? 'text-emerald-400'
                : 'text-amber-400'
            )}
          >
            {submission.autoScore} / {submission.autoTotal}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Автопроверка</div>
            <div className="text-xs text-slate-400">
              Верных ответов: {submission.autoScore} из {submission.autoTotal}
            </div>
          </div>
        </div>
      )}

      {/* Табы */}
      <div>
        <div className="grid grid-cols-4 gap-2 mb-4 p-1 rounded-xl bg-white/5 border border-white/10">
          {[
            {
              id: 'tasks' as Tab,
              label: 'Задачи',
              icon: Hash,
              available: true,
              badge: totalTasks,
            },
            {
              id: 'board' as Tab,
              label: 'Доска',
              icon: Palette,
              available: hasBoard,
            },
            {
              id: 'files' as Tab,
              label: 'Файлы',
              icon: FileText,
              available: hasFiles,
            },
            {
              id: 'text' as Tab,
              label: 'Текст',
              icon: Type,
              available: hasText,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => t.available && setTab(t.id)}
              disabled={!t.available}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition relative',
                !t.available
                  ? 'text-slate-600 cursor-not-allowed'
                  : tab === t.id
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden md:inline">{t.label}</span>
              {t.badge !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/10">
                  {t.badge}
                </span>
              )}
              {t.available && t.id !== 'tasks' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'tasks' && (
              <div className="space-y-3">
                {submission.homework.tasks.map((task, i) => {
                  const info = submission.taskAnswers?.[task.id];
                  const answer = info?.answer || '';
                  const passed = info?.passed ?? null;
                  const message = info?.message ?? null;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'backdrop-blur-xl border rounded-2xl p-5',
                        passed === true
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : passed === false
                          ? 'bg-red-500/5 border-red-500/30'
                          : 'bg-white/5 border-white/10'
                      )}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                            passed === true
                              ? 'bg-emerald-500/40'
                              : passed === false
                              ? 'bg-red-500/40'
                              : 'bg-gradient-to-br from-purple-500 to-blue-500'
                          )}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <MathText className="text-slate-100 leading-relaxed">
                             {task.text}
                          </MathText>
                          {task.imageUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={task.imageUrl}
                                alt={`Задача ${i + 1}`}
                                className="w-full h-auto max-h-64 object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pl-11">
                        {submission.taskCodes?.[task.id] ? (
                          <div>
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              <Code2 className="h-3 w-3" /> Код ученика:
                            </div>
                            <pre className="bg-slate-950/80 border border-emerald-500/30 rounded-lg p-3 text-xs font-mono text-emerald-100 overflow-x-auto max-h-96 overflow-y-auto">
                              {submission.taskCodes[task.id]}
                            </pre>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs text-slate-500 mb-1">
                              Ответ ученика:
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  'font-mono text-sm px-3 py-1.5 rounded-lg',
                                  passed === true
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : passed === false
                                    ? 'bg-red-500/20 text-red-200'
                                    : 'bg-white/5 text-slate-300'
                                )}
                              >
                                {answer || '— не отвечено —'}
                              </span>
                              {passed === true && (
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Верно
                                </span>
                              )}
                              {passed === false && (
                                <span className="text-xs text-red-400 flex items-center gap-1">
                                  <X className="h-3.5 w-3.5" /> {message}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'board' && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
                {submission.previewUrl ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={submission.previewUrl}
                        alt="Работа"
                        className="rounded-xl border border-white/10 w-full h-auto max-h-[700px] object-contain"
                    />
                    <a
                      href={submission.previewUrl}
                      download={`submission-v${submission.version}.png`}
                      className="inline-flex items-center gap-2 mt-3 text-sm text-purple-400 hover:text-purple-300 transition"
                    >
                      <Download className="h-4 w-4" /> Скачать PNG
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm py-8 text-center">
                    Доска не использовалась
                  </p>
                )}
              </div>
            )}

            {tab === 'files' && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
                {files.length === 0 ? (
                  <p className="text-slate-500 text-sm py-8 text-center">
                    Файлы не загружены
                  </p>
                ) : (
                  <div className="space-y-2">
                    {files.map((f, i) => {
                    const isImage = f.type?.startsWith('image/');
                    const isPdf = f.type === 'application/pdf';

                    return (
                        <div
                        key={i}
                        className="rounded-xl bg-white/5 border border-white/5 overflow-hidden"
                        >
                        {isImage ? (
                            <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={f.url}
                                alt={f.name}
                                className="w-full h-auto max-h-[600px] object-contain"
                            />
                            <div className="flex items-center justify-between p-3">
                                <div className="text-sm text-white truncate">{f.name}</div>
                                <a
                                href={f.url}
                                download={f.name}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                <Download className="h-3 w-3" /> Скачать
                                </a>
                            </div>
                            </div>
                        ) : isPdf ? (
                            <div>
                            <div className="flex items-center gap-3 p-3 border-b border-white/5">
                                <FileText className="h-5 w-5 text-red-400" />
                                <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">{f.name}</div>
                                <div className="text-xs text-slate-500">
                                    PDF · {(f.size / 1024).toFixed(0)} КБ
                                </div>
                                </div>
                                <a
                                href={f.url}
                                download={f.name}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                >
                                <Download className="h-3 w-3" /> Скачать
                                </a>
                            </div>
                            <iframe
                                src={f.url}
                                title={f.name}
                                className="w-full"
                                style={{ height: '600px', background: '#1e293b' }}
                            />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3">
                            <FileText className="h-5 w-5 text-blue-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">{f.name}</div>
                                <div className="text-xs text-slate-500">
                                {(f.size / 1024).toFixed(0)} КБ
                                </div>
                            </div>
                            <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                                <Download className="h-3 w-3" /> Открыть
                            </a>
                            </div>
                        )}
                        </div>
                    );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'text' && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                {submission.textAnswer ? (
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {submission.textAnswer}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm py-8 text-center">
                    Текстовый ответ отсутствует
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Проверка */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-400" />
          Проверка
        </h2>

        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">Оценка</label>
          <div className="grid grid-cols-4 gap-2">
            {EMOJIS.map((g) => {
              const isSelected = gradeEmoji === g.emoji;
              return (
                <button
                  key={g.emoji}
                  type="button"
                  onClick={() => setGradeEmoji(isSelected ? '' : g.emoji)}
                  title={g.label}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition',
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500/50 scale-105 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <span className="text-3xl leading-none">{g.emoji}</span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isSelected ? 'text-white' : 'text-slate-400'
                    )}
                  >
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-2 block">
            Комментарий для ученика
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Молодец! Всё верно, только в 3-й задаче обрати внимание на..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm resize-y focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => review('REVIEWED')}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Проверено
          </Button>
          <Button
            onClick={() => review('NEEDS_REVISION')}
            disabled={saving}
            variant="outline"
            className="gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            <AlertTriangle className="h-4 w-4" />
            На доработку
          </Button>
        </div>
      </div>
      {/* Блок ИИ-проверки */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                ИИ-проверка (DeepSeek)
              </h2>
              <p className="text-xs text-slate-400">
                Разбор ответа ученика нейросетью
              </p>
            </div>
          </div>
          <Button
            onClick={runAICheck}
            disabled={aiLoading}
            size="sm"
            className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
          >
            {aiLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : aiReview ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {aiLoading ? 'Проверка...' : aiReview ? 'Перепроверить' : 'Проверить через ИИ'}
          </Button>
        </div>

        {aiReview && (
          <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10">
            {aiScore !== null && (
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'text-3xl font-bold',
                    aiScore >= 80
                      ? 'text-emerald-400'
                      : aiScore >= 50
                      ? 'text-amber-400'
                      : 'text-red-400'
                  )}
                >
                  {aiScore}
                </div>
                <div className="text-xs text-slate-500">/100</div>
              </div>
            )}
            <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {aiReview}
            </div>
          </div>
        )}
      </div>
      {/* История версий */}
      {allVersions.length > 1 && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-400" />
            История версий ({allVersions.length})
          </h2>
          <div className="space-y-2">
            {allVersions.map((v) => {
              const isCurrent = v.id === submission.id;
              return (
                <Link
                  key={v.id}
                  href={`/teacher/homework/submission/${v.id}`}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition',
                    isCurrent
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                      v.status === 'REVIEWED'
                        ? 'bg-emerald-500/30'
                        : v.status === 'NEEDS_REVISION'
                        ? 'bg-orange-500/30'
                        : 'bg-slate-500/30'
                    )}
                  >
                    v{v.version}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      {isCurrent ? 'Текущая сдача' : `Версия ${v.version}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(v.createdAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  {v.autoTotal !== null && v.autoTotal > 0 && (
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-md flex-shrink-0',
                        v.autoScore === v.autoTotal
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      )}
                    >
                      {v.autoScore}/{v.autoTotal}
                    </span>
                  )}
                  {v.gradeEmoji && (
                    <span className="text-2xl leading-none flex-shrink-0">
                      {v.gradeEmoji}
                    </span>
                  )}
                  {v.previewUrl && (
                    <Palette className="h-4 w-4 text-purple-400 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}