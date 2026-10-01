'use client';
import { Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type Accent } from './ThemeProvider';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: 'lavender', label: 'Нежная лаванда', color: '#b8a4d8' },
  { id: 'warm', label: 'Тёплый крем', color: '#d8b98a' },
  { id: 'mint', label: 'Мятная свежесть', color: '#8ec9b0' },
];

export function ThemeToggle() {
  const { theme, accent, setAccent, toggleTheme, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!mounted) return <Button variant="ghost" size="icon" />;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      {theme === 'light' && (
        <div className="relative" ref={ref}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            title="Оттенок светлой темы"
          >
            <Palette className="h-5 w-5" />
          </Button>

          {open && (
            <div className="absolute right-0 top-full mt-2 p-2 rounded-xl bg-white border border-black/10 shadow-xl flex gap-2 z-50">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAccent(a.id);
                    setOpen(false);
                  }}
                  title={a.label}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition',
                    accent === a.id
                      ? 'border-slate-800 scale-110'
                      : 'border-black/10 hover:scale-105'
                  )}
                  style={{ background: a.color }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}