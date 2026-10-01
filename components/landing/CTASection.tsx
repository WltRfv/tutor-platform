'use client';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section ref={ref} className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Размытое свечение позади — как в карточке тарифа */}
          <div className="absolute inset-0 cta-glow rounded-3xl" aria-hidden />

          {/* Сам блок: полупрозрачный, с рамкой, как популярный тариф */}
          <div className="relative cta-card rounded-3xl px-8 py-16 md:py-20 text-center">
            {/* Бейдж — иконка + текст, без фона */}
            <div className="inline-flex items-center gap-2 mb-6 cta-badge">
              <Sparkles className="h-4 w-4 cta-badge-icon" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase cta-badge-text">
                Начни учиться сегодня
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto cta-title">
              Готов улучшить свои оценки?
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-10 cta-text">
              Оставь заявку — я свяжусь с тобой и подберу удобное время для первого занятия.
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
                  className="cta-btn-outline h-12 px-8"
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