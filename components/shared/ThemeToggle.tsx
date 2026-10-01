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

  const activeLabel = isLight
    ? LIGHT_ACCENTS.find((a) => a.id === accentLight)?.label
    : DARK_ACCENTS.find((a) => a.id === accentDark)?.label;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="relative" ref={ref}>
        <Button
          variant="ghost"
          size="icon"
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
                ? 'bg-white border-black/10 w-60'
                : 'bg-slate-800 border-white/10 w-52'
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
              <div className="space-y-2">
                {(['lavender', 'warm', 'mint'] as const).map((family) => (
                  <div key={family} className="flex gap-2">
                    {LIGHT_ACCENTS.filter((a) => a.family === family).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setAccentLight(a.id as LightAccent);
                          setOpen(false);
                        }}
                        title={a.label}
                        className={cn(
                          'flex-1 h-9 rounded-lg border-2 transition',
                          accentLight === a.id
                            ? 'border-slate-800 scale-105 shadow-md'
                            : 'border-black/5 hover:scale-105'
                        )}
                        style={{ background: a.color }}
                      />
                    ))}
                  </div>
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

            <div
              className={cn(
                'mt-2 text-[10px] text-center',
                isLight ? 'text-slate-400' : 'text-slate-400'
              )}
            >
              {activeLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}