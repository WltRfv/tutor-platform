'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FileText, Calendar, Code, LayoutDashboard, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useActivityTracker } from '@/hooks/use-activity-tracker';

const items = [
  { href: '/student', label: 'Главная', icon: LayoutDashboard },
  { href: '/student/notes', label: 'Конспекты', icon: BookOpen },
  { href: '/student/tests', label: 'Тесты', icon: FileText },
  { href: '/student/compiler', label: 'Компилятор', icon: Code },
  { href: '/student/calendar', label: 'Календарь', icon: Calendar },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useActivityTracker();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Link href="/" className="font-bold text-xl">
            Репетитор<span className="text-purple-500">.</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Кабинет ученика</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                  active ? 'bg-purple-500 text-white' : 'hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t flex justify-between">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}