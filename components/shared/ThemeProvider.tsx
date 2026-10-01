'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type Accent = 'lavender' | 'warm' | 'mint';

type ThemeContextType = {
  theme: Theme;
  accent: Accent;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
  toggleTheme: () => void;
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  accent: 'lavender',
  setTheme: () => {},
  setAccent: () => {},
  toggleTheme: () => {},
  mounted: false,
});

const VALID_ACCENTS: Accent[] = ['lavender', 'warm', 'mint'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [accent, setAccentState] = useState<Accent>('lavender');
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const applyAccent = (a: Accent) => {
    document.documentElement.setAttribute('data-accent', a);
  };

  useEffect(() => {
    setMounted(true);

    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedAccent = localStorage.getItem('accent') as Accent | null;

    const t: Theme =
      storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    const a: Accent =
      storedAccent && VALID_ACCENTS.includes(storedAccent)
        ? storedAccent
        : 'lavender';

    setThemeState(t);
    setAccentState(a);
    applyTheme(t);
    applyAccent(a);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem('theme', t);
  };

  const setAccent = (a: Accent) => {
    setAccentState(a);
    applyAccent(a);
    localStorage.setItem('accent', a);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider
      value={{ theme, accent, setTheme, setAccent, toggleTheme, mounted }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}