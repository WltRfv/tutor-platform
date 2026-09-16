import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { About } from '@/components/landing/About';
import { Subjects } from '@/components/landing/Subjects';
import { Pricing } from '@/components/landing/Pricing';         // ← новый импорт
import { CTASection } from '@/components/landing/CTASection';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AnimatedBackground } from '@/components/landing/AnimatedBackground';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <AnimatedBackground />

      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-slate-950/50 border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-white">
            Репетитор<span className="text-purple-500">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/register" className="text-sm text-slate-300 hover:text-white transition-colors hidden md:block">
              Регистрация
            </Link>
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors hidden md:block">
              Войти
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Hero />
      <Stats />
      <About />
      <Subjects />
      <Pricing />
      <CTASection />

      <footer className="relative border-t border-white/5 py-10">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Репетитор. Математика и Информатика.</p>
        </div>
      </footer>
    </main>
  );
}