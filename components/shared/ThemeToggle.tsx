'use client';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

type Props = { direction?: 'up' | 'down' };

export function ThemeToggle(_props: Props = {}) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return <Button variant="ghost" size="icon" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}