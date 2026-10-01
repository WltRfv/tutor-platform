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
  ChevronLeft,
  GraduationCap,
  ClipboardList,
  Layers,
  Menu,
  X,
  Settings,
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
  { href: '/student/settings', label: 'Настройки', icon: Settings },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useActivityTracker();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] p-2.5 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-xl text-white shadow-lg"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </button>

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

      <aside
        className={cn(
          'fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 border-r border-white/5 bg-slate-900 flex flex-col transition-all duration-300',
          collapsed ? 'w-72 lg:w-20' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('border-b border-white/5', collapsed ? 'p-4 lg:p-3' : 'p-4')}>
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-bold text-xl text-white flex items-center"
              onClick={() => setMobileOpen(false)}
            >
              {collapsed ? (
                <span className="hidden lg:inline">
                  Р<span className="text-purple-500">.</span>
                </span>
              ) : null}
              <span className={cn(collapsed && 'lg:hidden')}>
                Репетитор<span className="text-purple-500">.</span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <div className={cn(collapsed && 'lg:hidden')}>
                <NotificationBell />
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={toggleCollapsed}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
                title={collapsed ? 'Развернуть' : 'Свернуть'}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p
            className={cn(
              'text-xs text-slate-500 mt-1 flex items-center gap-1.5',
              collapsed && 'lg:hidden'
            )}
          >
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
                title={collapsed ? item.label : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg text-sm transition-all group border',
                  collapsed ? 'lg:justify-center lg:px-2 px-3 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className={cn('flex-1', collapsed && 'lg:hidden')}>
                  {item.label}
                </span>
                {active && !collapsed && (
                  <ChevronRight className="h-3 w-3 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'p-3 border-t border-white/5 flex items-center',
            collapsed ? 'lg:justify-center lg:flex-col lg:gap-2 justify-between' : 'justify-between'
          )}
        >
          <ThemeToggle direction="up" />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(
              'flex items-center gap-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition',
              collapsed ? 'lg:p-2 px-3 py-2' : 'px-3 py-2'
            )}
            title={collapsed ? 'Выйти' : undefined}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && 'lg:hidden')}>Выйти</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto lg:pl-0 pt-16 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}