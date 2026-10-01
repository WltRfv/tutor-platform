'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export type LightAccent =
  | 'lavender-soft' | 'lavender' | 'lavender-rich'
  | 'warm-soft' | 'warm' | 'warm-rich'
  | 'mint-soft' | 'mint' | 'mint-rich';

export type DarkAccent = 'dark-classic' | 'dark-slate' | 'dark-emerald';

export const LIGHT_ACCENTS = [
  { id: 'lavender-soft', family: 'lavender', label: 'Лаванда — нежная',   color: '#e6dcf2' },
  { id: 'lavender',      family: 'lavender', label: 'Лаванда',             color: '#b8a4d8' },
  { id: 'lavender-rich', family: 'lavender', label: 'Лаванда — глубокая',  color: '#8b6db8' },
  { id: 'warm-soft',     family: 'warm',     label: 'Крем — нежный',       color: '#f5ead8' },
  { id: 'warm',          family: 'warm',     label: 'Тёплый крем',         color: '#d8b98a' },
  { id: 'warm-rich',     family: 'warm',     label: 'Терракота',           color: '#c08552' },
  { id: 'mint-soft',     family: 'mint',     label: 'Мята — нежная',       color: '#d8efe4' },
  { id: 'mint',          family: 'mint',     label: 'Мята',                color: '#8ec9b0' },
  { id: 'mint-rich',     family: 'mint',     label: 'Шалфей',              color: '#5a9b7b' },
] as const;

export const DARK_ACCENTS = [
  { id: 'dark-classic', label: 'Классика (фиолет)', color: '#a855f7' },
  { id: 'dark-slate',   label: 'Графит',             color: '#64748b' },
  { id: 'dark-emerald', label: 'Изумруд',            color: '#10b981' },
] as const;

type ThemeContextType = {
  theme: Theme;
  accentLight: LightAccent;
  accentDark: DarkAccent;
  setTheme: (t: Theme) => void;
  setAccentLight: (a: LightAccent) => void;
  setAccentDark: (a: DarkAccent) => void;
  toggleTheme: () => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  accentLight: 'lavender',
  accentDark: 'dark-classic',
  setTheme: () => {},
  setAccentLight: () => {},
  setAccentDark: () => {},
  toggleTheme: () => {},
  mounted: false,
});

const VALID_LIGHT: readonly LightAccent[] = LIGHT_ACCENTS.map((a) => a.id);
const VALID_DARK: readonly DarkAccent[] = DARK_ACCENTS.map((a) => a.id);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [accentLight, setAccentLightState] = useState<LightAccent>('lavender');
  const [accentDark, setAccentDarkState] = useState<DarkAccent>('dark-classic');
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const applyLight = (a: LightAccent) => {
    document.documentElement.setAttribute('data-light', a);
  };

  const applyDark = (a: DarkAccent) => {
    document.documentElement.setAttribute('data-dark', a);
  };

  useEffect(() => {
    setMounted(true);

    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedLight = localStorage.getItem('accentLight') as LightAccent | null;
    const storedDark = localStorage.getItem('accentDark') as DarkAccent | null;

    const t: Theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    const l: LightAccent =
      storedLight && VALID_LIGHT.includes(storedLight) ? storedLight : 'lavender';
    const d: DarkAccent =
      storedDark && VALID_DARK.includes(storedDark) ? storedDark : 'dark-classic';

    setThemeState(t);
    setAccentLightState(l);
    setAccentDarkState(d);
    applyTheme(t);
    applyLight(l);
    applyDark(d);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem('theme', t);
  };

  const setAccentLight = (a: LightAccent) => {
    setAccentLightState(a);
    applyLight(a);
    localStorage.setItem('accentLight', a);
  };

  const setAccentDark = (a: DarkAccent) => {
    setAccentDarkState(a);
    applyDark(a);
    localStorage.setItem('accentDark', a);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentLight,
        accentDark,
        setTheme,
        setAccentLight,
        setAccentDark,
        toggleTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}