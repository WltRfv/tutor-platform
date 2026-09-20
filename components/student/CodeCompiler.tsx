'use client';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Terminal, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'pascal', label: 'Pascal' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c++', label: 'C++' },
  { value: 'java', label: 'Java' },
];

const DEFAULT_CODE = `# Привет, мир!
print("Hello, world!")

# Твоя программа:
`;

type Metrics = {
  totalChars: number;
  pastedChars: number;
  typedChars: number;
  typingDuration: number;
  pasteCount: number;
  avgTypingSpeed: number;
};

export function CodeCompiler() {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  // Метрики для детектора ИИ
  const firstKeystrokeAt = useRef<number | null>(null);
  const pastedChars = useRef(0);
  const pasteCount = useRef(0);

  const resetMetrics = () => {
    firstKeystrokeAt.current = null;
    pastedChars.current = 0;
    pasteCount.current = 0;
  };

  const handleChange = (val: string) => {
    if (!firstKeystrokeAt.current && val.length > 0) {
      firstKeystrokeAt.current = Date.now();
    }
    setCode(val);
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

  const collectMetrics = (): Metrics => {
    const totalChars = code.length;
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

  const run = async () => {
    setRunning(true);
    setOutput('');

    const metrics = collectMetrics();

    try {
      const res = await fetch('/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language.value,
          code,
          metrics,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');

      const out = data.run?.stdout || data.run?.output || '';
      const err = data.run?.stderr || '';

      if (err) setOutput(`❌ Ошибка:\n${err}`);
      else if (out) setOutput(out);
      else setOutput('(пустой вывод)');
    } catch (e: any) {
      toast.error(e.message);
      setOutput(`❌ ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-1 grid lg:grid-cols-2 gap-4 min-h-0">
      <div className="flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <select
            value={language.value}
            onChange={(e) => {
              const lang = LANGUAGES.find((l) => l.value === e.target.value)!;
              setLanguage(lang);
            }}
            className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setCode('');
                resetMetrics();
              }}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={run}
              disabled={running}
              size="sm"
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {running ? 'Запуск...' : 'Запустить'}
            </Button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={handlePaste}
          spellCheck={false}
          className="flex-1 w-full bg-slate-950/80 text-slate-100 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
          style={{ minHeight: '400px' }}
        />
      </div>

      <div className="flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-white/5 text-slate-300">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Результат</span>
        </div>

        <motion.pre
          key={output}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="flex-1 w-full bg-slate-950/80 text-slate-100 font-mono text-sm p-4 overflow-auto whitespace-pre-wrap"
        >
          {output || '▶ Нажми «Запустить», чтобы увидеть результат'}
        </motion.pre>
      </div>
    </div>
  );
}