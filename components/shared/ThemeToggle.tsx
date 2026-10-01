'use client';
import { Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useTheme,
  LIGHT_ACCENTS,
  DARK_ACCENTS,
  type LightAccent,
  type DarkAccent,
} from './ThemeProvider';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = { direction?: 'up' | 'down' };

export function ThemeToggle({ direction = 'down' }: Props) {
  const {
    theme,
    accentLight,
    accentDark,
    setAccentLight,
    setAccentDark,
    toggleTheme,
    mounted,
  } = useTheme();
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

  const isLight = theme === 'light';
  const isUp = direction === 'up';

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="relative" ref={ref}>
        <Button
          variant="ghost"
          size="icon"
          className="theme-toggle-btn"
          onClick={() => setOpen(!open)}
          title="Оттенок темы"
        >
          <Palette className="h-5 w-5" />
        </Button>

        {open && (
          <div
            className={cn(
              'absolute right-0 p-3 rounded-xl shadow-2xl z-50 border',
              isUp ? 'bottom-full mb-2' : 'top-full mt-2',
              isLight
                ? 'bg-white border-black/10 w-64'
                : 'bg-slate-800 border-white/10 w-60'
            )}
          >
            <div
              className={cn(
                'text-xs font-semibold mb-2',
                isLight ? 'text-slate-500' : 'text-slate-300'
              )}
            >
              {isLight ? 'Светлая тема' : 'Тёмная тема'}
            </div>

            {isLight ? (
              <div className="space-y-1.5">
                {LIGHT_ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAccentLight(a.id as LightAccent);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-lg border transition text-left',
                      accentLight === a.id
                        ? 'border-slate-800 bg-slate-100'
                        : 'border-black/5 hover:bg-slate-50'
                    )}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ background: a.color }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-slate-800">
                        {a.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 truncate">
                        {a.hint}
                      </span>
                    </span>
                    {accentLight === a.id && (
                      <span className="text-slate-800 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {DARK_ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAccentDark(a.id as DarkAccent);
                      setOpen(false);
                    }}
                    title={a.label}
                    className={cn(
                      'flex-1 h-10 rounded-lg border-2 transition',
                      accentDark === a.id
                        ? 'border-white scale-105 shadow-md'
                        : 'border-white/10 hover:scale-105'
                    )}
                    style={{ background: a.color }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}