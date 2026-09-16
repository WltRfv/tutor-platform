'use client';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Gift, Clock, ArrowRight } from 'lucide-react';

const plans = [
  {
    duration: '60 минут',
    price: '1 100 ₽',
    features: [
      'Разбор одной темы или домашнего задания',
      'Отработка типовых задач',
      'Домашнее задание после занятия',
      'Доступ к конспектам на платформе',
    ],
    popular: false,
  },
  {
    duration: '90 минут',
    price: '1 600 ₽',
    features: [
      'Глубокий разбор темы + практика',
      'Решение задач повышенной сложности',
      'Работа над ошибками',
      'Домашнее задание + проверка',
      'Доступ к конспектам и компилятору',
    ],
    popular: true,
  },
];

export function Pricing() {
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
              Стоимость занятий
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Прозрачные цены без скрытых платежей
          </p>
        </motion.div>

        {/* Бесплатное пробное занятие */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-sm p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Gift className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
                  ✨ БОНУС
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Первое занятие — бесплатно
                </h3>
                <p className="text-slate-300">
                  Знакомимся, определяем уровень знаний, составляем план обучения.
                  45 минут — без обязательств.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Карточки с ценами */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold shadow-lg z-10">
                  Популярный выбор
                </div>
              )}
              <div
                className={`absolute inset-0 rounded-2xl blur-xl transition-opacity ${
                  plan.popular
                    ? 'bg-gradient-to-br from-purple-500/40 to-blue-500/40 opacity-60 group-hover:opacity-100'
                    : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-60'
                }`}
              />
              <div
                className={`relative h-full backdrop-blur-xl rounded-2xl p-8 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/50'
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 text-slate-300 mb-4">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{plan.duration}</span>
                </div>

                <div className="text-4xl md:text-5xl font-bold text-white mb-6">
                  {plan.price}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                    <Button
                        className={`w-full gap-2 h-12 ${
                        plan.popular
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 text-white'
                            : 'bg-transparent border border-white/30 text-white hover:bg-white/10 hover:text-white'
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                    >
                        Записаться <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}