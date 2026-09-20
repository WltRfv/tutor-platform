'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Code2,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useActivityTracker } from '@/hooks/use-activity-tracker';

const items = [
  { href: '/student', label: 'Главная', icon: LayoutDashboard },
  { href: '/student/topics', label: 'Темы', icon: Layers },
  { href: '/student/homework', label: 'Домашние задания', icon: ClipboardList },
  { href: '/student/compiler', label: 'Компилятор', icon: Code2 },
  { href: '/student/calendar', label: 'Расписание', icon: Calendar },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  useActivityTracker();

  // Закрываем мобильное меню при смене страницы
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Кнопка-гамбургер */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] p-2.5 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-xl text-white shadow-lg"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Затемнение */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Сайдбар */}
      <aside
        className={cn(
          'fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-slate-900 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-bold text-xl text-white"
              onClick={() => setMobileOpen(false)}
            >
              Репетитор<span className="text-purple-500">.</span>
            </Link>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" />
            Кабинет ученика
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active =
              item.href === '/student'
                ? pathname === '/student'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group border',
                  active
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5 flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 overflow-y-auto lg:pl-0 pt-16 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}