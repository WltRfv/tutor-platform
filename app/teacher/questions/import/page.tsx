'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Upload,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ParsedQuestion = {
  class?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: number;
  type: string;
  points?: number;
  text: string;
  options?: string[];
  correct?: number;
  correctMulti?: number[];
  correctText?: string;
  correctNumber?: number;
  correctBool?: boolean;
};

type Result = {
  ok: boolean;
  index: number;
  error?: string;
};

export default function ImportQuestionsPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedQuestion[] | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);
  const [stats, setStats] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handlePreview = async () => {
    if (!text.trim()) return toast.error('Вставь текст');
    setLoadingPreview(true);
    setPreview(null);
    setResults(null);
    setStats(null);
    try {
      const res = await fetch('/api/teacher/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.questions);
      toast.success(`Распознано: ${data.total} вопросов`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!text.trim()) return toast.error('Вставь текст');
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results);
      setStats({ imported: data.imported, skipped: data.skipped, total: data.total });
      setPreview(data.questions);
      toast.success(`Импортировано: ${data.imported} из ${data.total}`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/teacher/questions"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> К банку заданий
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
          <Upload className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Импорт заданий</h1>
          <p className="text-slate-400 text-sm">
            Вставь текст из Google Docs — система распарсит вопросы
          </p>
        </div>
      </div>

      {/* Инструкция */}
      <div className="backdrop-blur-xl bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-slate-300">
            <div className="font-semibold text-white mb-2">Как импортировать:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Открой Google Docs с заданиями</li>
              <li>Выдели всё (Cmd+A) → скопируй (Cmd+C)</li>
              <li>Вставь в поле ниже (Cmd+V)</li>
              <li>Нажми «Проверить» — увидишь превью</li>
              <li>Если всё ок — нажми «Импортировать»</li>
            </ol>
            <div className="mt-3 text-xs">
              Между вопросами должен быть разделитель: <code className="text-purple-300">━━━ ВОПРОС ━━━</code>
            </div>
          </div>
        </div>
      </div>

      {/* Поле ввода */}
      <div className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Вставь текст из Google Docs..."
          rows={15}
          className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 text-sm font-mono resize-y focus:outline-none focus:border-purple-500/50 leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span>Символов: {text.length}</span>
          <button
            onClick={() => setText('')}
            className="text-slate-400 hover:text-red-400 transition"
          >
            Очистить
          </button>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          onClick={handlePreview}
          disabled={loadingPreview || !text.trim()}
          variant="outline"
          className="gap-2 border-white/20 text-white hover:bg-white/5"
        >
          {loadingPreview ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Проверить
        </Button>
        <Button
          onClick={handleImport}
          disabled={loading || !text.trim()}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {loading ? 'Импорт...' : 'Импортировать'}
        </Button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Всего</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="text-xs text-emerald-300 mb-1">Импортировано</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.imported}</div>
          </div>
          <div className="backdrop-blur-xl bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="text-xs text-amber-300 mb-1">Пропущено</div>
            <div className="text-2xl font-bold text-amber-400">{stats.skipped}</div>
          </div>
        </div>
      )}

      {/* Превью */}
      {preview && preview.length > 0 && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="text-sm font-semibold text-white mb-4">
            Распознанные вопросы ({preview.length})
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {preview.map((q, i) => {
              const result = results?.find((r) => r.index === i);
              const isError = result && !result.ok;

              return (
                <div
                  key={i}
                  className={cn(
                    'p-3 rounded-xl border text-xs',
                    isError
                      ? 'bg-red-500/10 border-red-500/30'
                      : result?.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-950/50 border-white/10'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {result?.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : isError ? (
                      <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-slate-300 font-mono">#{i + 1}</span>
                        {q.subject && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">
                            {q.subject}
                          </span>
                        )}
                        {q.topic && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">
                            {q.topic}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300">
                          {q.type}
                        </span>
                      </div>
                      <div className="text-slate-300 line-clamp-2">{q.text}</div>
                      {result && !result.ok && (
                        <div className="text-red-300 mt-1">⚠ {result.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Пустой результат */}
      {preview && preview.length === 0 && (
        <div className="text-center py-12 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Не распознано ни одного вопроса</p>
          <p className="text-xs mt-2">
            Проверь, что между вопросами разделитель <code>━━━ ВОПРОС ━━━</code>
          </p>
        </div>
      )}
    </div>
  );
}