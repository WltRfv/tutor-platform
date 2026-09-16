'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Terminal, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python 3', piston: 'python', version: '3.10.0' },
  { value: 'javascript', label: 'JavaScript', piston: 'javascript', version: '18.15.0' },
  { value: 'cpp', label: 'C++', piston: 'c++', version: '10.2.0' },
  { value: 'java', label: 'Java', piston: 'java', version: '15.0.2' },
  { value: 'pascal', label: 'Pascal', piston: 'pascal', version: '3.2.2' },
];

const DEFAULT_CODE = `# Привет, мир!
print("Hello, world!")

# Твоя программа:
`;

export function CodeCompiler() {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setOutput('');
    try {
      const res = await fetch('/api/compiler/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language.piston,
          version: language.version,
          code,
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
            <Button onClick={() => setCode('')} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={run}
              disabled={running}
              size="sm"
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? 'Запуск...' : 'Запустить'}
            </Button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
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