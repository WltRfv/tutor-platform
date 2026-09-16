'use client';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Calculator, Shapes, BookOpen, GraduationCap, Trophy, Code } from 'lucide-react';

const subjects = [
  {
    icon: Calculator,
    title: 'Математика 5–6',
    desc: 'Основы арифметики, дроби, проценты, текстовые задачи',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BookOpen,
    title: 'Алгебра 7–9',
    desc: 'Уравнения, функции, степени, прогрессии, системы',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shapes,
    title: 'Геометрия 7–9',
    desc: 'Треугольники, окружности, теоремы, площади и объёмы',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: GraduationCap,
    title: 'Подготовка к ОГЭ',
    desc: 'Полный разбор всех заданий, тренировочные варианты',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Trophy,
    title: 'Подготовка к ВПР',
    desc: 'Систематизация знаний, отработка типовых заданий',
    color: 'from-yellow-500 to-orange-500',
  },
    {
    icon: Code,
    title: 'Информатика',
    desc: 'Вся школьная программа: программирование на Python, алгоритмы, встроенный компилятор',
    color: 'from-indigo-500 to-purple-500',
    },
];

export function Subjects() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section ref={ref} className="relative py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Предметы
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Все направления школьной программы с индивидуальным подходом
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300`} />
              <div className="relative h-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${s.color} mb-4 shadow-lg`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}