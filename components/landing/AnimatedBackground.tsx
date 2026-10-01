'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Particle = {
  id: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
};

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 5,
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Базовый градиент — цвета из CSS-переменных */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom right, var(--bg-1), var(--bg-2), var(--bg-3))',
        }}
      />

      {/* Сетка */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)',
        }}
      />

      {/* Блобы */}
      <motion.div
        className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, var(--blob-1), transparent 70%)',
        }}
        animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full blur-[140px]"
        style={{
          background: 'radial-gradient(circle, var(--blob-2), transparent 70%)',
        }}
        animate={{ x: [0, -80, 0], y: [0, 80, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[30%] w-[450px] h-[450px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, var(--blob-3), transparent 70%)',
        }}
        animate={{ x: [0, 60, 0], y: [0, -60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Частицы */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: 'var(--particle)',
          }}
          animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}