'use client';
import { useTheme, type Theme, type DarkAccent } from './ThemeProvider';
import { Sun, Moon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DARK_OPTIONS: { id: DarkAccent; label: string; hint: string; color: string }[] = [
  {
    id: 'dark-classic',
    label: 'Классика',
    hint: 'Фиолетово-синий градиент',
    color: '#a855f7',
  },
  {
    id: 'dark-slate',
    label: 'Графит',
    hint: 'Спокойный серо-синий',
    color: '#64748b',
  },
  {
    id: 'dark-emerald',
    label: 'Изумруд',
    hint: 'Холодный зелёный',
    color: '#10b981',
  },
];

export function AppearanceSettings() {
  const { theme, setTheme, accentDark, setAccentDark, mounted, syncEnabled } = useTheme();

  if (!mounted) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded mb-4" />
        <div className="h-24 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Внешний вид</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Тема сохраняется в аккаунте и подтягивается при входе с любого устройства
          </p>
        </div>
        {syncEnabled && (
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
            Синхронизировано
          </span>
        )}
      </div>

      {/* Переключатель светлая / тёмная */}
      <div className="mb-6">
        <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
          Режим
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-xl border transition text-left',
              theme === 'light'
                ? 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div
              className={cn(
                'p-2.5 rounded-lg flex-shrink-0 transition',
                theme === 'light'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-white/10'
              )}
            >
              <Sun
                className={cn(
                  'h-5 w-5',
                  theme === 'light' ? 'text-white' : 'text-slate-400'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Светлая</div>
              <div className="text-xs text-slate-400">Нежная лаванда</div>
            </div>
            {theme === 'light' && (
              <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-xl border transition text-left',
              theme === 'dark'
                ? 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            )}
          >
            <div
              className={cn(
                'p-2.5 rounded-lg flex-shrink-0 transition',
                theme === 'dark'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'bg-white/10'
              )}
            >
              <Moon
                className={cn(
                  'h-5 w-5',
                  theme === 'dark' ? 'text-white' : 'text-slate-400'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Тёмная</div>
              <div className="text-xs text-slate-400">Ночной режим</div>
            </div>
            {theme === 'dark' && (
              <Check className="h-4 w-4 text-purple-400 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Палитра тёмной темы — только когда выбрана тёмная */}
      {theme === 'dark' && (
        <div>
          <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Оттенок тёмной темы
          </div>
          <div className="grid grid-cols-3 gap-3">
            {DARK_OPTIONS.map((opt) => {
              const active = accentDark === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccentDark(opt.id)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition',
                    active
                      ? 'border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full shadow-lg"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${opt.color}, ${opt.color}99)`,
                    }}
                  />
                  <div className="text-center">
                    <div className="text-xs font-semibold text-white">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      {opt.hint}
                    </div>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}