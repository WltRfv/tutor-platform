'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';
export type DarkAccent = 'dark-classic' | 'dark-slate' | 'dark-emerald';

type ThemeContextType = {
  theme: Theme;
  accentDark: DarkAccent;
  setTheme: (t: Theme) => void;
  setAccentDark: (a: DarkAccent) => void;
  toggleTheme: () => void;
  mounted: boolean;
  syncEnabled: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  accentDark: 'dark-classic',
  setTheme: () => {},
  setAccentDark: () => {},
  toggleTheme: () => {},
  mounted: false,
  syncEnabled: false,
});

const VALID_DARK: readonly DarkAccent[] = ['dark-classic', 'dark-slate', 'dark-emerald'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [accentDark, setAccentDarkState] = useState<DarkAccent>('dark-classic');
  const [mounted, setMounted] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const applyDark = (a: DarkAccent) => {
    document.documentElement.setAttribute('data-dark', a);
  };

  // Дебаунс-сохранение в БД
  const persistToServer = useCallback(
    (payload: { theme?: Theme; accentDark?: DarkAccent }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await fetch('/api/me/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          // тихо игнорим — не критично, localStorage сохранит
        }
      }, 500);
    },
    []
  );

  // Первичная загрузка: localStorage + сразу же попытка синхронизации с БД
  useEffect(() => {
    setMounted(true);

    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const storedAccent = localStorage.getItem('accentDark') as DarkAccent | null;

    const t: Theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    const d: DarkAccent =
      storedAccent && VALID_DARK.includes(storedAccent) ? storedAccent : 'dark-classic';

    setThemeState(t);
    setAccentDarkState(d);
    applyTheme(t);
    applyDark(d);

    // Тянем из БД (только если пользователь залогинен — эндпоинт вернёт 401 и мы просто ничего не сделаем)
    (async () => {
      try {
        const res = await fetch('/api/me/theme');
        if (!res.ok) return;
        const json = await res.json();
        if (!json.theme && !json.accentDark) return;

        if (json.theme === 'light' || json.theme === 'dark') {
          setThemeState(json.theme);
          applyTheme(json.theme);
          localStorage.setItem('theme', json.theme);
        }
        if (json.accentDark && VALID_DARK.includes(json.accentDark)) {
          setAccentDarkState(json.accentDark);
          applyDark(json.accentDark);
          localStorage.setItem('accentDark', json.accentDark);
        }
        setSyncEnabled(true);
      } catch {
        // ничего
      }
    })();
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem('theme', t);
    persistToServer({ theme: t });
  };

  const setAccentDark = (a: DarkAccent) => {
    setAccentDarkState(a);
    applyDark(a);
    localStorage.setItem('accentDark', a);
    persistToServer({ accentDark: a });
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentDark,
        setTheme,
        setAccentDark,
        toggleTheme,
        mounted,
        syncEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}