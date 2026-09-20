'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HomeworkBoard } from '@/components/shared/HomeworkBoard';
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  FileText,
  Type,
  Palette,
  Upload,
  X,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Download,
  Check,
  Hash,
  Type as TypeIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MathText } from '@/components/shared/MathText';

type Task = {
  id: string;
  order: number;
  text: string;
  imageUrl: string | null;
  hasAutoCheck: boolean;
  answerType: string;
  points: number;
};

type Homework = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  subjectName: string;
  imageUrl: string | null;
  dueDate: string | null;
  teacherName: string;
  tasks: Task[];
};

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

type LastSubmission = {
  id: string;
  version: number;
  status: string;
  teacherComment: string | null;
  gradeEmoji: string | null;
  textAnswer: string | null;
  files: FileItem[] | null;
  previewUrl: string | null;
  taskAnswers: Record<string, TaskAnswerInfo> | null;
  autoScore: number | null;
  autoTotal: number | null;
} | null;

type Tab = 'tasks' | 'board' | 'files' | 'text';

export function HomeworkView({
  homework,
  lastSubmission,
  historyCount,
}: {
  homework: Homework;
  lastSubmission: LastSubmission;
  historyCount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('tasks');

  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [boardData, setBoardData] = useState<any>(null);
  const [boardPreview, setBoardPreview] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleBoardSave = (data: { boardData: any; previewUrl: string }) => {
    setBoardData(data.boardData);
    setBoardPreview(data.previewUrl);
    toast.success('Доска сохранена — не забудь отправить работу');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    setUploading(true);
    try {
      for (const file of Array.from(selected)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: больше 10 МБ`);
          continue;
        }
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/homework/upload', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFiles((prev) => [...prev, data.file]);
        toast.success(`${file.name} загружен`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const setTaskAnswer = (taskId: string, val: string) => {
    setTaskAnswers((prev) => ({ ...prev, [taskId]: val }));
  };

  const submit = async () => {
    const answeredCount = Object.values(taskAnswers).filter((a) => a.trim()).length;
    const hasContent =
      answeredCount > 0 ||
      (boardData && boardPreview) ||
      files.length > 0 ||
      textAnswer.trim();

    if (!hasContent) {
      return toast.error('Ответь хотя бы на одну задачу или приложи материал');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkId: homework.id,
          boardData: boardData || null,
          previewUrl: boardPreview || null,
          files: files.length > 0 ? files : null,
          textAnswer: textAnswer.trim() || null,
          taskAnswers: Object.fromEntries(
            Object.entries(taskAnswers).map(([k, v]) => [k, v.trim()])
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Работа отправлена (v${data.submission.version})`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isReviewed = lastSubmission?.status === 'REVIEWED';
  const needsRevision = lastSubmission?.status === 'NEEDS_REVISION';
  const canEdit = !isReviewed;

  const answeredCount = Object.values(taskAnswers).filter((a) => a.trim()).length;
  const totalTasks = homework.tasks.length;

  const tabs: { id: Tab; label: string; icon: any; filled: boolean; badge?: number }[] = [
    {
      id: 'tasks',
      label: 'Задачи',
      icon: ClipboardList,
      filled: answeredCount > 0,
      badge: totalTasks,
    },
    { id: 'board', label: 'Доска', icon: Palette, filled: !!boardPreview },
    { id: 'files', label: 'Файлы', icon: FileText, filled: files.length > 0 },
    { id: 'text', label: 'Коммент', icon: Type, filled: !!textAnswer.trim() },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/student/homework"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> К списку заданий
      </Link>

      {/* Заголовок */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg flex-shrink-0">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold text-white mb-2">
              {homework.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                {homework.subjectName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200">
                {totalTasks} {totalTasks === 1 ? 'задача' : totalTasks < 5 ? 'задачи' : 'задач'}
              </span>
              {homework.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  до {new Date(homework.dueDate).toLocaleDateString('ru-RU')}
                </span>
              )}
              <span>👨‍🏫 {homework.teacherName}</span>
              {historyCount > 0 && (
                <span className="text-slate-500">
                  История: {historyCount} сдач(и)
                </span>
              )}
            </div>
          </div>
        </div>

        {homework.description && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <MathText className="text-slate-200 leading-relaxed">
                {homework.description}
            </MathText>
          </div>
        )}

        {homework.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={homework.imageUrl} alt="Условие" className="w-full h-auto" />
          </div>
        )}
      </div>

      {/* Статус проверки */}
      {lastSubmission && (
        <div
          className={cn(
            'backdrop-blur-xl border rounded-2xl p-5 mb-6',
            isReviewed
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : needsRevision
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-white/5 border-white/10'
          )}
        >
          <div className="flex items-start gap-3">
            {isReviewed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : needsRevision ? (
              <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Send className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span className="text-white font-semibold">
                  {isReviewed
                    ? 'Работа проверена'
                    : needsRevision
                    ? 'Отправлено на доработку'
                    : 'Работа сдана'}
                </span>
                <span className="text-xs text-slate-500">
                  v{lastSubmission.version}
                </span>
                {lastSubmission.gradeEmoji && (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-3xl leading-none">
                    {lastSubmission.gradeEmoji}
                  </span>
                )}
              </div>

              {lastSubmission.autoTotal !== null &&
                lastSubmission.autoScore !== null && (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-400">Автопроверка: </span>
                    <span
                      className={cn(
                        'font-semibold',
                        lastSubmission.autoScore === lastSubmission.autoTotal
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      )}
                    >
                      {lastSubmission.autoScore} из {lastSubmission.autoTotal}
                    </span>
                  </div>
                )}

              {lastSubmission.teacherComment && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <MessageSquare className="h-3 w-3" /> Комментарий учителя
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">
                    {lastSubmission.teacherComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Редактор */}
      {canEdit && (
        <>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                {lastSubmission
                  ? `Сдать v${lastSubmission.version + 1}`
                  : 'Сдать работу'}
              </h2>
              <p className="text-xs text-slate-500">
                Ответь на задачи и при необходимости приложи доску или файлы
              </p>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">Отвечено: </span>
              <span
                className={cn(
                  'font-semibold',
                  answeredCount === totalTasks
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                )}
              >
                {answeredCount} из {totalTasks}
              </span>
            </div>
          </div>

          {/* Табы */}
          <div className="grid grid-cols-4 gap-2 mb-4 p-1 rounded-xl bg-white/5 border border-white/10">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  tab === t.id
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
                {t.filled && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </div>

          {/* Контент таба */}
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
                  {homework.tasks.map((task, i) => {
                    const answer = taskAnswers[task.id] || '';
                    return (
                      <div
                        key={task.id}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <MathText className="text-slate-100 leading-relaxed">
                                {task.text}
                            </MathText>
                            {task.imageUrl && (
                              <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={task.imageUrl}
                                  alt={`Задача ${i + 1}`}
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {task.hasAutoCheck && (
                          <div className="flex items-center gap-2 mb-2 text-xs text-purple-300">
                            {task.answerType === 'NUMBER' ? (
                              <Hash className="h-3 w-3" />
                            ) : (
                              <TypeIcon className="h-3 w-3" />
                            )}
                            Автопроверка: введи {task.answerType === 'NUMBER' ? 'число' : 'ответ'}
                          </div>
                        )}

                        <Input
                          value={answer}
                          onChange={(e) =>
                            setTaskAnswer(task.id, e.target.value)
                          }
                          placeholder={
                            task.hasAutoCheck
                              ? task.answerType === 'NUMBER'
                                ? 'Число...'
                                : 'Ответ...'
                              : 'Твой ответ (опционально)...'
                          }
                          className="bg-slate-950/50 border-white/10 text-white"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'board' && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div style={{ height: '600px', isolation: 'isolate' }}>
                    <HomeworkBoard onSave={handleBoardSave} />
                  </div>
                </div>
              )}

              {tab === 'files' && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <label className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-500/50 cursor-pointer transition">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400" />
                    )}
                    <div className="text-center">
                      <div className="text-sm text-white font-medium mb-1">
                        {uploading ? 'Загрузка...' : 'Загрузить фото или файл'}
                      </div>
                      <div className="text-xs text-slate-500">
                        PNG, JPG, PDF, DOCX · до 10 МБ
                      </div>
                    </div>
                  </label>

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                        >
                          <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {f.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {(f.size / 1024).toFixed(0)} КБ
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'text' && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Общий комментарий или развёрнутое решение..."
                    rows={10}
                    className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl p-4 text-sm resize-y focus:outline-none focus:border-purple-500/50 leading-relaxed"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* К отправке */}
          {(answeredCount > 0 ||
            boardPreview ||
            files.length > 0 ||
            textAnswer.trim()) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 backdrop-blur-xl bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    К отправке
                  </div>
                  <div className="text-xs text-slate-500">
                    {answeredCount > 0 && `Задач: ${answeredCount}/${totalTasks}`}
                    {answeredCount > 0 && (boardPreview || files.length > 0) && ' · '}
                    {boardPreview && 'Доска'}
                    {boardPreview && files.length > 0 && ' · '}
                    {files.length > 0 && `${files.length} файл(ов)`}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={submit}
              disabled={submitting}
              className="h-12 px-8 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting
                ? 'Отправка...'
                : lastSubmission
                ? 'Отправить новую версию'
                : 'Отправить работу'}
            </Button>
          </div>
        </>
      )}

      {/* Разбор сдачи */}
      {lastSubmission && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Результаты v{lastSubmission.version}
          </h3>

          {lastSubmission.taskAnswers &&
            homework.tasks.map((task, i) => {
              const info = lastSubmission.taskAnswers?.[task.id];
              if (!info) return null;
              return (
                <div
                  key={task.id}
                  className={cn(
                    'backdrop-blur-xl border rounded-2xl p-4',
                    info.passed === true
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : info.passed === false
                      ? 'bg-red-500/5 border-red-500/30'
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                        info.passed === true
                          ? 'bg-emerald-500/30'
                          : info.passed === false
                          ? 'bg-red-500/30'
                          : 'bg-slate-500/30'
                      )}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <MathText className="text-sm text-slate-300 mb-2">
                        {task.text}
                      </MathText>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-slate-500">
                          Твой ответ:
                        </span>
                        <span className="text-sm text-white font-mono">
                          {info.answer || '—'}
                        </span>
                        {info.passed === true && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Верно
                          </span>
                        )}
                        {info.passed === false && (
                          <span className="text-xs text-red-400 flex items-center gap-1">
                            <X className="h-3 w-3" /> {info.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {lastSubmission.previewUrl && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <Palette className="h-3 w-3" /> Доска
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lastSubmission.previewUrl}
                alt="Твоя работа"
                className="rounded-xl border border-white/10 w-full h-auto max-h-[600px] object-contain"
              /> 
              <a
                href={lastSubmission.previewUrl}
                download={`homework-v${lastSubmission.version}.png`}
                className="inline-flex items-center gap-2 mt-3 text-sm text-purple-400 hover:text-purple-300 transition"
              >
                <Download className="h-4 w-4" /> Скачать PNG
              </a>
            </div>
          )}

          {lastSubmission.files && lastSubmission.files.length > 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-xs text-slate-500 mb-2">
                Файлы ({lastSubmission.files.length})
              </div>
              <div className="space-y-2">
                {lastSubmission.files.map((f, i) => {
                const isImage = f.type?.startsWith('image/');
                const isPdf = f.type === 'application/pdf';
                return (
                    <div
                    key={i}
                    className="rounded-xl bg-white/5 border border-white/5 overflow-hidden"
                    >
                    {isImage && (
                        <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={f.url}
                            alt={f.name}
                            className="w-full h-auto max-h-[500px] object-contain"
                        />
                        </div>
                    )}
                    {isPdf && (
                        <iframe
                        src={f.url}
                        title={f.name}
                        className="w-full"
                        style={{ height: '500px', background: '#1e293b' }}
                        />
                    )}
                    <div className="flex items-center gap-3 p-3">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-white truncate flex-1">{f.name}</span>
                        <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300"
                        >
                        Открыть
                        </a>
                    </div>
                    </div>
                );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}