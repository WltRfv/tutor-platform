'use client';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Target } from 'lucide-react';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (inView) {
      animate(count, to, { duration: 2, ease: 'easeOut' });
    }
  }, [inView, to, count]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

const stats = [
  { type: 'counter', value: 3, suffix: '+', label: 'года опыта', icon: '🎓' },
  { type: 'counter', value: 500, suffix: '+', label: 'проведённых занятий', icon: '📚' },
  { type: 'counter', value: 92, suffix: '%', label: 'сдали ОГЭ на 4-5', icon: '🏆' },
  { type: 'text', title: 'Входная диагностика', label: 'знаний и типа восприятия', icon: '🎯' },
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s: any, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-purple-500/50 transition-all h-full flex flex-col justify-center">
                <div className="text-4xl mb-2">{s.icon}</div>

                {s.type === 'counter' ? (
                  <>
                    <div className="text-4xl font-bold bg-gradient-to-br from-white to-purple-200 bg-clip-text text-transparent">
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                  </>
                ) : (
                  <>
                    <div className="text-base font-semibold text-white leading-tight">
                      {s.title}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}