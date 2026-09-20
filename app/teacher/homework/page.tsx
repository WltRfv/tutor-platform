import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  Globe,
  User as UserIcon,
} from 'lucide-react';

export default async function TeacherHomeworkPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const teacherId = (session.user as any).id;

  const homeworks = await prisma.homework.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' },
    include: {
      subject: { select: { name: true } },
      targetUser: { select: { name: true } },
      submissions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          userId: true,
          createdAt: true,
          version: true,
        },
      },
    },
  });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Домашние задания</h1>
            <p className="text-slate-400 text-sm">
              Всего заданий: {homeworks.length}
            </p>
          </div>
        </div>

        <Link
          href="/teacher/homework/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
        >
          <Plus className="h-4 w-4" />
          Создать задание
        </Link>
      </div>

      {homeworks.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока нет заданий</p>
          <Link
            href="/teacher/homework/new"
            className="inline-block mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Создать первое →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {homeworks.map((hw) => {
            const uniqueStudents = new Set(hw.submissions.map((s) => s.userId));
            const reviewed = hw.submissions.filter((s) => s.status === 'REVIEWED').length;
            const totalStudents = uniqueStudents.size;

            return (
              <Link
                key={hw.id}
                href={`/teacher/homework/${hw.id}`}
                className="block group"
              >
                <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate mb-1">
                      {hw.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                        {hw.subject.name}
                      </span>
                      {hw.topic && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200">
                          {hw.topic}
                        </span>
                      )}
                      {hw.targetType === 'SPECIFIC' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {hw.targetUser?.name || 'ученику'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Всем
                        </span>
                      )}
                      {hw.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          до {new Date(hw.dueDate).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {totalStudents} сдал(и)
                      </span>
                      {reviewed > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> {reviewed} проверено
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}