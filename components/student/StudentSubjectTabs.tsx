'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calculator,
  Shapes,
  BookOpen,
  GraduationCap,
  Trophy,
  Code,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Subject = {
  id: string;
  name: string;
  count?: number;
  category?: string;
};

// Иконки и цвета для категорий предметов
const CATEGORY_CONFIG: Record<
  string,
  { icon: any; gradient: string; ring: string }
> = {
  math: {
    icon: Calculator,
    gradient: 'from-purple-500 to-pink-500',
    ring: 'ring-purple-500/30',
  },
  algebra: {
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    ring: 'ring-blue-500/30',
  },
  geometry: {
    icon: Shapes,
    gradient: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-500/30',
  },
  informatics: {
    icon: Code,
    gradient: 'from-indigo-500 to-purple-500',
    ring: 'ring-indigo-500/30',
  },
  vpr: {
    icon: Trophy,
    gradient: 'from-orange-500 to-red-500',
    ring: 'ring-orange-500/30',
  },
  oge: {
    icon: GraduationCap,
    gradient: 'from-red-500 to-pink-500',
    ring: 'ring-red-500/30',
  },
  transfer: {
    icon: Layers,
    gradient: 'from-pink-500 to-purple-500',
    ring: 'ring-pink-500/30',
  },
};

// Определяем категорию по коду предмета
function getCategoryFromCode(code: string): string {
  if (code.startsWith('MATH')) return 'math';
  if (code.startsWith('ALGEBRA')) return 'algebra';
  if (code.startsWith('GEOMETRY')) return 'geometry';
  if (code.startsWith('INFORMATICS')) return 'informatics';
  if (code.startsWith('VPR')) return 'vpr';
  if (code.startsWith('OGE')) return 'oge';
  if (code.startsWith('TRANSFER')) return 'transfer';
  return 'math';
}

export function StudentSubjectTabs({
  basePath,
  subjects,
  currentSubjectId,
}: {
  basePath: string;
  subjects: Subject[];
  currentSubjectId: string | null;
}) {
  if (subjects.length <= 1) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-purple-400" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {currentSubjectId ? 'Предметы' : 'Выбери предмет'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {subjects.map((s) => {
          const active = s.id === currentSubjectId;
          const code = (s as any).code || '';
          const category = (s as any).category || getCategoryFromCode(code);
          const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.math;
          const Icon = config.icon;

          return (
            <Link
              key={s.id}
              href={`${basePath}?subject=${s.id}`}
              className={cn(
                'group relative overflow-hidden rounded-2xl border p-4 transition-all',
                active
                  ? 'border-white/20 bg-white/10 ring-2 ' + config.ring
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]'
              )}
            >
              {/* Градиентное свечение */}
              <div
                className={cn(
                  'absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br blur-2xl transition-opacity',
                  config.gradient,
                  active ? 'opacity-40' : 'opacity-15 group-hover:opacity-30'
                )}
              />

              {/* Галочка для активного */}
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center z-10"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}

              <div className="relative flex flex-col gap-3">
                {/* Иконка */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br',
                    config.gradient
                  )}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Название и счётчик */}
                <div>
                  <div
                    className={cn(
                      'text-sm font-semibold leading-tight',
                      active ? 'text-white' : 'text-slate-200'
                    )}
                  >
                    {s.name}
                  </div>
                  {s.count !== undefined && (
                    <div
                      className={cn(
                        'text-xs mt-1',
                        active ? 'text-purple-200' : 'text-slate-500'
                      )}
                    >
                      {s.count} {getItemLabel(s.count)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getItemLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'материалов';
  if (mod10 === 1) return 'материал';
  if (mod10 >= 2 && mod10 <= 4) return 'материала';
  return 'материалов';
}