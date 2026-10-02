import { prisma } from '@/lib/prisma';
import { Activity, TrendingUp, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EVENT_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  tab_hidden: { label: 'Ушёл со вкладки', color: 'text-red-400', emoji: '🚪' },
  tab_visible: { label: 'Вернулся', color: 'text-emerald-400', emoji: '👁' },
  window_blur: { label: 'Окно неактивно', color: 'text-orange-400', emoji: '💤' },
  window_focus: { label: 'Окно активно', color: 'text-blue-400', emoji: '✅' },
};

export default async function ActivityPage() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [weekActivities, recentActivities] = await Promise.all([
    // Все события за 7 дней — для диаграммы
    prisma.activity.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: {
        userId: true,
        eventType: true,
        createdAt: true,
        user: { select: { name: true, grade: true } },
      },
    }),
    // Последние 100 событий — для ленты
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true, email: true, grade: true } },
      },
    }),
  ]);

  // --- Столбики по дням ---
  const dailyCounts: Record<string, number> = {};
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dailyCounts[key] = 0;
    dayKeys.push(key);
  }
  weekActivities.forEach((a) => {
    const key = new Date(a.createdAt).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
    if (dailyCounts[key] !== undefined) dailyCounts[key]++;
  });
  const maxDaily = Math.max(...Object.values(dailyCounts), 1);

  // --- Топ учеников за 7 дней ---
  const byUser = new Map<
    string,
    { name: string; grade: number | null; count: number }
  >();
  weekActivities.forEach((a) => {
    const existing = byUser.get(a.userId);
    if (existing) existing.count++;
    else
      byUser.set(a.userId, {
        name: a.user.name,
        grade: a.user.grade,
        count: 1,
      });
  });
  const topUsers = Array.from(byUser.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxUser = topUsers[0]?.count || 1;

  const totalWeek = weekActivities.length;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Активность учеников</h1>
          <p className="text-slate-400 text-sm">
            Всего событий за неделю: {totalWeek}
          </p>
        </div>
      </div>

      {/* Верхний блок: диаграмма + топ учеников */}
      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Столбики по дням */}
        <div className="lg:col-span-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              За 7 дней
            </h2>
            <span className="text-xs text-slate-500">События по дням</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {dayKeys.map((day) => {
              const count = dailyCounts[day];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-slate-500 font-medium">
                    {count}
                  </div>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-purple-500/60 to-blue-500/80 transition-all hover:from-purple-400 hover:to-blue-400"
                      style={{
                        height: `${Math.max((count / maxDaily) * 100, 4)}%`,
                        minHeight: '6px',
                      }}
                      title={`${count} событий`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Топ учеников */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Топ активных</h2>
          </div>
          {topUsers.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Событий пока нет
            </p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate pr-2">
                      <span className="text-slate-500 mr-1">#{i + 1}</span>
                      {u.name}
                      {u.grade ? ` · ${u.grade} кл.` : ''}
                    </span>
                    <span className="text-white font-semibold flex-shrink-0">
                      {u.count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${(u.count / maxUser) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Лента событий */}
      {recentActivities.length === 0 ? (
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
            {recentActivities.map((a) => {
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