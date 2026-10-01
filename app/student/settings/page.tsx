import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Settings, Mail, User as UserIcon, GraduationCap, MessageCircle } from 'lucide-react';
import { AppearanceSettings } from '@/components/shared/AppearanceSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MESSENGER_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  max: 'MAX',
  vk: 'VK',
  other: 'Другое',
};

export default async function StudentSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      grade: true,
      grades: true,
      messengerType: true,
      messengerHandle: true,
    },
  });

  if (!user) redirect('/login');

  const gradesText =
    user.grades && user.grades.length > 0
      ? user.grades.map((g) => `${g} класс`).join(', ')
      : user.grade
      ? `${user.grade} класс`
      : '—';

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Настройки</h1>
          <p className="text-slate-400 text-sm">Профиль и внешний вид</p>
        </div>
      </div>

      {/* Внешний вид */}
      <div className="mb-6">
        <AppearanceSettings />
      </div>

      {/* Мой профиль */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Мой профиль</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <UserIcon className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">Имя</div>
              <div className="text-sm text-white truncate">{user.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Mail className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">Email</div>
              <div className="text-sm text-white truncate">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <GraduationCap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">Классы</div>
              <div className="text-sm text-white">{gradesText}</div>
            </div>
          </div>

          {user.messengerHandle && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <MessageCircle className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500">
                  {user.messengerType
                    ? MESSENGER_LABELS[user.messengerType] ?? user.messengerType
                    : 'Мессенджер'}
                </div>
                <div className="text-sm text-white truncate">
                  {user.messengerHandle}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-200">
            Если нужно изменить имя, email или контакты — напиши учителю.
          </p>
        </div>
      </div>
    </div>
  );
}