'use client';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CheckCircle2, Award, Heart, Zap } from 'lucide-react';
import Image from 'next/image';

const features = [
  { icon: Zap, text: 'Современные методики преподавания' },
  { icon: Heart, text: 'Индивидуальный подход к каждому ученику' },
  { icon: Award, text: 'Опыт подготовки к ОГЭ и ВПР' },
  { icon: CheckCircle2, text: 'Лично разработанная онлайн-платформа с тестами и компилятором' },
];

export function About() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section ref={ref} className="relative py-24">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Обо{' '}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                мне
              </span>
            </h2>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              Привет! Меня зовут Снежана, мне 21 год. Я репетитор по математике и информатике.
            </p>
            <p className="text-slate-400 mb-6 leading-relaxed">
                2 года работала в онлайн-школе, а последний год занимаюсь частной практикой.
                За это время провела более <span className="text-purple-300 font-medium">500 уроков</span>{' '}
                и помогла десяткам учеников подтянуть оценки, сдать ОГЭ и ВПР на высокие баллы.
                На занятиях использую интерактивные материалы, разбираю сложные темы простым языком
                и подбираю задания под уровень каждого ученика.
            </p>

            <div className="relative mb-8 p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm">
              <div className="absolute -top-3 left-5 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-semibold">
                Почему я?
              </div>
              <p className="text-slate-200 leading-relaxed">
                Мне 21 год, и я считаю, что <span className="text-purple-300 font-medium">молодые преподаватели легче находят подход к детям</span>.
                Я говорю с учениками на одном языке, понимаю их интересы и современные тренды,
                объясняю сложные темы простыми словами и без лишней академической сухости.
                Ученики не боятся задавать вопросы и не стесняются признаться, что что-то непонятно.
              </p>
            </div>

            <ul className="space-y-3">
              {features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 text-slate-300"
                >
                  <f.icon className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span>{f.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl blur-2xl opacity-30" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl">
              <Image
                src="/teacher.jpg"
                alt="Снежана — репетитор по математике и информатике"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                style={{ objectPosition: '50% 20%' }}
                priority
                />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white text-xl font-bold">Снежана</p>
                <p className="text-purple-200 text-sm">Репетитор по математике и информатике</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}