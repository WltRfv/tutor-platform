'use client';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/shared/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster richColors position="top-right" theme="dark" />
    </ThemeProvider>
  );
}