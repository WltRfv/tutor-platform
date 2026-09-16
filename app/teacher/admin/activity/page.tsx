import { prisma } from '@/lib/prisma';
import { Activity, Filter } from 'lucide-react';

const EVENT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  tab_hidden: { label: 'Ушёл со вкладки', color: 'text-red-400', emoji: '🚪' },
  tab_visible: { label: 'Вернулся', color: 'text-emerald-400', emoji: '👁' },
  window_blur: { label: 'Окно неактивно', color: 'text-orange-400', emoji: '💤' },
  window_focus: { label: 'Окно активно', color: 'text-blue-400', emoji: '✅' },
};

export default async function ActivityPage() {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true, grade: true } } },
  });

  // Группируем по ученикам для краткой сводки
  const byUser = activities.reduce((acc, a) => {
    if (!acc[a.userId]) acc[a.userId] = { name: a.user.name, count: 0 };
    acc[a.userId].count++;
    return acc;
  }, {} as Record<string, { name: string; count: number }>);

  const topUsers = Object.entries(byUser)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Активность учеников</h1>
          <p className="text-slate-400 text-sm">Последние 100 событий</p>
        </div>
      </div>

      {topUsers.length > 0 && (
        <div className="grid md:grid-cols-5 gap-3 mb-6">
          {topUsers.map(([userId, info], i) => (
            <div
              key={userId}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="text-xs text-slate-500 mb-1">#{i + 1}</div>
              <div className="text-sm text-white font-medium truncate">{info.name}</div>
              <div className="text-lg font-bold text-blue-400 mt-1">{info.count}</div>
            </div>
          ))}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Событий пока нет</p>
        </div>
      ) : (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/5 text-xs text-slate-500 font-medium">
            <div className="col-span-4">Ученик</div>
            <div className="col-span-4">Событие</div>
            <div className="col-span-2">Класс</div>
            <div className="col-span-2 text-right">Время</div>
          </div>
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {activities.map((a) => {
              const ev = EVENT_LABELS[a.eventType] || {
                label: a.eventType,
                color: 'text-slate-400',
                emoji: '•',
              };
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-white/5 transition text-sm"
                >
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {a.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-200 truncate">{a.user.name}</span>
                  </div>
                  <div className={`col-span-4 flex items-center gap-2 ${ev.color}`}>
                    <span>{ev.emoji}</span>
                    <span className="truncate">{ev.label}</span>
                  </div>
                  <div className="col-span-2 text-slate-400">
                    {a.user.grade ? `${a.user.grade} кл.` : '—'}
                  </div>
                  <div className="col-span-2 text-right text-slate-500 text-xs">
                    {new Date(a.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}