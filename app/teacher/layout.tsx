'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Shield,
  GraduationCap,
  Calendar,
  FileText,
  Activity,
  Code2,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Layers,
  HelpCircle,
  Menu,
  X,
  BookMarked,
  RefreshCw,
  Presentation,
} from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

type Mode = 'teacher' | 'admin';

const teacherMenu = [
  { href: '/teacher', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/teacher/applications', label: 'Заявки', icon: Users },
  { href: '/teacher/students', label: 'Ученики', icon: GraduationCap },
  { href: '/teacher/topics', label: 'Темы', icon: Layers },
  { href: '/teacher/questions', label: 'Банк заданий', icon: HelpCircle },
  { href: '/teacher/homework', label: 'Домашние задания', icon: ClipboardList },
  { href: '/teacher/content', label: 'Конспекты и тесты', icon: BookOpen },
  { href: '/teacher/lesson-plans', label: 'Методички', icon: BookMarked },
  { href: '/teacher/presentations', label: 'Презентации', icon: Presentation },
  { href: '/teacher/calendar', label: 'Расписание', icon: Calendar },
  { href: '/teacher/retakes', label: 'Пересдачи', icon: RefreshCw },
];

const adminMenu = [
  { href: '/teacher/admin', label: 'Обзор системы', icon: LayoutDashboard },
  { href: '/teacher/admin/activity', label: 'Активность', icon: Activity },
  { href: '/teacher/admin/compiler', label: 'Логи компилятора', icon: Code2 },
  { href: '/teacher/admin/submissions', label: 'Сданные работы', icon: FileText },
  { href: '/teacher/admin/notifications', label: 'Уведомления', icon: MessageSquare },
  { href: '/teacher/admin/settings', label: 'Настройки', icon: Settings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const mode: Mode = pathname.startsWith('/teacher/admin') ? 'admin' : 'teacher';
  const items = mode === 'teacher' ? teacherMenu : adminMenu;

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

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    router.push(newMode === 'teacher' ? '/teacher' : '/teacher/admin');
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
        {/* Шапка */}
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
              'text-xs text-slate-500 mt-1',
              collapsed && 'lg:hidden'
            )}
          >
            {mode === 'teacher' ? 'Кабинет учителя' : 'Администрирование'}
          </p>
        </div>

        {/* Переключатель Учитель/Админ — скрыт при collapsed */}
        {!collapsed && (
          <div className="p-3 border-b border-white/5">
            <div className="relative grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950/70 border border-white/5">
              <button
                onClick={() => switchMode('teacher')}
                className={cn(
                  'relative z-10 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  mode === 'teacher' ? 'text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Учитель
              </button>
              <button
                onClick={() => switchMode('admin')}
                className={cn(
                  'relative z-10 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  mode === 'admin' ? 'text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                <Shield className="h-3.5 w-3.5" />
                Админ
              </button>

              <motion.div
                className={cn(
                  'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg',
                  mode === 'teacher'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600'
                )}
                animate={{ x: mode === 'teacher' ? 0 : '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </div>
          </div>
        )}

        {collapsed && (
          <div className="hidden lg:flex justify-center p-3 border-b border-white/5">
            <button
              onClick={() => switchMode(mode === 'teacher' ? 'admin' : 'teacher')}
              className={cn(
                'p-2 rounded-lg transition',
                mode === 'teacher'
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white'
                  : 'bg-gradient-to-r from-amber-500/30 to-orange-600/30 text-white'
              )}
              title={mode === 'teacher' ? 'Переключить на Админ' : 'Переключить на Учитель'}
            >
              {mode === 'teacher' ? (
                <GraduationCap className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
            </button>
          </div>
        )}

        {/* Меню */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="space-y-1"
            >
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm transition-all group border',
                      collapsed ? 'lg:justify-center lg:px-2 px-3 py-2.5' : 'px-3 py-2.5',
                      active
                        ? mode === 'teacher'
                          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border-purple-500/30'
                          : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-white border-amber-500/30'
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
            </motion.div>
          </AnimatePresence>
        </nav>

        {/* Низ */}
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