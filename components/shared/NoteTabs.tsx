'use client';
import { useState } from 'react';
import { MathText } from './MathText';
import { BookOpen, Wrench, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'theory' | 'practice' | 'selfwork';

type Props = {
  theory: string;
  practice: string | null;
  selfWork: string | null;
  selfWorkExtra?: React.ReactNode;
};

export function NoteTabs({ theory, practice, selfWork, selfWorkExtra }: Props) {
  const [tab, setTab] = useState<Tab>('theory');

  const tabs: { id: Tab; label: string; icon: any; hasContent: boolean }[] = [
    { id: 'theory', label: 'Теория', icon: BookOpen, hasContent: !!theory?.trim() },
    {
      id: 'practice',
      label: 'Практика на занятии',
      icon: Wrench,
      hasContent: !!practice?.trim(),
    },
    {
      id: 'selfwork',
      label: 'Самостоятельная работа',
      icon: ClipboardCheck,
      hasContent: !!selfWork?.trim(),
    },
  ];

  return (
    <div>
      {/* Меню вкладок */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-4 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap',
                active
                  ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {!t.hasContent && (
                <span className="text-[10px] text-slate-500 ml-1">пусто</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Контент вкладки */}
      {tab === 'theory' && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          {theory?.trim() ? (
            <MathText className="text-slate-300 leading-relaxed">{theory}</MathText>
          ) : (
            <p className="text-slate-500 text-center py-8">Пока ничего нет</p>
          )}
        </div>
      )}

      {tab === 'practice' && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          {practice?.trim() ? (
            <MathText className="text-slate-300 leading-relaxed">{practice}</MathText>
          ) : (
            <p className="text-slate-500 text-center py-8">
              Практика на занятии не задана
            </p>
          )}
        </div>
      )}

      {tab === 'selfwork' && (
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            {selfWork?.trim() ? (
              <MathText className="text-slate-300 leading-relaxed">{selfWork}</MathText>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Самостоятельная работа не задана
              </p>
            )}
          </div>
          {selfWorkExtra}
        </div>
      )}
    </div>
  );
}