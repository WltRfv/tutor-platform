'use client';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

type Particle = {
  id: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
};

export function CTASection() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  return (
    <section ref={ref} className="relative py-24 cta-section">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative cta-block"
        >
          {/* Многослойный фон: центр светлый, края тёмные */}
          <div className="absolute inset-0 cta-block-bg" />

          {/* Лёгкий блик сверху */}
          <div className="absolute inset-0 cta-block-sheen" />

          {/* Плавающие частицы — дают глубину */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-1 h-1 rounded-full cta-particle"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              animate={{ y: [0, -25, 0], opacity: [0, 1, 0] }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
              }}
            />
          ))}

          <div className="relative px-8 py-16 md:py-20 text-center">
            {/* Бейдж без плашки — иконка + текст + подчёркивание */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 cta-badge"
            >
              <Sparkles className="h-4 w-4 cta-badge-icon" />
              <span className="text-sm font-semibold tracking-wide uppercase cta-badge-text">
                Начни учиться сегодня
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto cta-title">
              Готов улучшить свои оценки?
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-10 cta-text">
              Оставь заявку - я свяжусь с тобой и подберу удобное время для первого занятия.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cta-btn-primary gap-2 font-semibold h-12 px-8"
                >
                  Подать заявку <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="cta-btn-outline h-12 px-8 bg-transparent"
                >
                  Войти
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}