import { prisma } from '@/lib/prisma';
import { MessageSquare, CheckCircle2, XCircle, Bell } from 'lucide-react';

export default async function NotificationsPage() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_TEACHER_CHAT_ID;

  const recentNotifications = await prisma.activity.findMany({
    where: { eventType: { in: ['tab_hidden', 'tab_visible'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Уведомления</h1>
          <p className="text-slate-400 text-sm">Статус интеграции с Telegram</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Telegram Bot Token</h2>
          </div>
          {token ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Настроен</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Не настроен</span>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">
            Переменная окружения <code className="text-purple-300">TELEGRAM_BOT_TOKEN</code>
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Chat ID группы</h2>
          </div>
          {chatId ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Настроен</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Не настроен</span>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">
            Переменная окружения <code className="text-purple-300">TELEGRAM_TEACHER_CHAT_ID</code>
          </p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Что отправляется в Telegram</h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>🔔 Новые заявки на регистрацию</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>✅ Одобренные и отклонённые заявки</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>📝 Сдача тестов учениками</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>⚙️ Запуски кода с ошибками</span>
          </li>
        </ul>

        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-200">
            ⚠️ Локально в России <code>api.telegram.org</code> может быть недоступен без VPN.
            На Vercel уведомления работают без ограничений.
          </p>
        </div>
      </div>
    </div>
  );
}