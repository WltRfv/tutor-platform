'use client';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Play,
  Loader2,
  Terminal,
  Code2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python 3',
  pascal: 'Pascal',
  javascript: 'JavaScript',
  'c++': 'C++',
  java: 'Java',
};

const DEFAULT_CODE: Record<string, string> = {
  python: '# Напиши код здесь\nprint("Hello, world!")\n',
  pascal: "program Task;\nbegin\n  writeln('Hello, world!');\nend.\n",
  javascript: '// Напиши код здесь\nconsole.log("Hello, world!");\n',
  'c++':
    '// Напиши код здесь\n#include <iostream>\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}\n',
  java: '// Напиши код здесь\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}\n',
};

export type CodeMetrics = {
  totalChars: number;
  pastedChars: number;
  typedChars: number;
  typingDuration: number;
  pasteCount: number;
  avgTypingSpeed: number;
};

export function TaskCodeEditor({
  language,
  starterCode,
  value,
  onChange,
  onMetricsChange,
  disabled = false,
}: {
  language: string;
  starterCode: string | null;
  value: string;
  onChange: (val: string) => void;
  onMetricsChange?: (m: CodeMetrics) => void;
  disabled?: boolean;
}) {
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const firstKeystrokeAt = useRef<number | null>(null);
  const pastedChars = useRef(0);
  const pasteCount = useRef(0);

  const collectMetrics = (): CodeMetrics => {
    const totalChars = value.length;
    const pasted = Math.min(pastedChars.current, totalChars);
    const typed = Math.max(0, totalChars - pasted);
    const duration = firstKeystrokeAt.current
      ? Math.max(1, Math.round((Date.now() - firstKeystrokeAt.current) / 1000))
      : 0;
    const avgSpeed = duration > 0 ? typed / duration : 0;
    return {
      totalChars,
      pastedChars: pasted,
      typedChars: typed,
      typingDuration: duration,
      pasteCount: pasteCount.current,
      avgTypingSpeed: Math.round(avgSpeed * 100) / 100,
    };
  };

  // Сообщаем наружу о метриках при каждом изменении value
  useEffect(() => {
    if (onMetricsChange) {
      onMetricsChange(collectMetrics());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const initialCode = starterCode || DEFAULT_CODE[language] || '';

  const handleChange = (val: string) => {
    if (!firstKeystrokeAt.current && val.length > 0) {
      firstKeystrokeAt.current = Date.now();
    }
    onChange(val);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      pastedChars.current += pasted.length;
      pasteCount.current += 1;
      if (!firstKeystrokeAt.current) {
        firstKeystrokeAt.current = Date.now();
      }
    }
  };

  const run = async () => {
    if (!value.trim()) return toast.error('Сначала напиши код');
    setRunning(true);
    setOutput('');
    const metrics = collectMetrics();

    try {
      const res = await fetch('/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code: value, metrics }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');

      const out = data.run?.stdout || '';
      const err = data.run?.stderr || '';

      if (err) setOutput(`❌ Ошибка:\n${err}`);
      else if (out) setOutput(out);
      else setOutput('(пустой вывод)');
    } catch (e: any) {
      setOutput(`❌ ${e.message}`);
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const resetCode = () => {
    if (!confirm('Сбросить код к начальному?')) return;
    onChange(starterCode || DEFAULT_CODE[language] || '');
    firstKeystrokeAt.current = null;
    pastedChars.current = 0;
    pasteCount.current = 0;
    setOutput('');
  };

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-200">
            {LANGUAGE_LABELS[language] || language}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetCode}
            disabled={disabled}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
            title="Сбросить код"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <Button
            type="button"
            onClick={run}
            disabled={running || disabled}
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {running ? 'Запуск...' : 'Запустить'}
          </Button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={handlePaste}
        disabled={disabled}
        spellCheck={false}
        placeholder={initialCode || 'Напиши код здесь...'}
        rows={12}
        className="w-full bg-slate-950/80 text-slate-100 font-mono text-sm p-4 resize-y focus:outline-none leading-relaxed"
        style={{ minHeight: '200px' }}
      />

      {output && (
        <div className="border-t border-emerald-500/20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50">
            <Terminal className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Результат
            </span>
          </div>
          <pre
            className={cn(
              'p-4 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto',
              output.startsWith('❌')
                ? 'bg-red-500/10 text-red-200'
                : 'bg-slate-950/80 text-emerald-200'
            )}
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}