import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Users,
  Globe,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';
import { SubmissionsList } from '@/components/teacher/SubmissionsList';

export default async function HomeworkViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const homework = await prisma.homework.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true } },
      targetUser: { select: { name: true } },
      submissions: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, grade: true, email: true } },
        },
      },
    },
  });

  if (!homework) notFound();

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href="/teacher/homework"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> К списку заданий
      </Link>

      <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg flex-shrink-0">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold text-white mb-2">
              {homework.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200">
                {homework.subject.name}
              </span>
              {homework.topicName && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200">
                  {homework.topicName}
                </span>
              )}
              {homework.targetType === 'SPECIFIC' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200">
                  <UserIcon className="h-3 w-3" />
                  {homework.targetUser?.name}
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200">
                  <Globe className="h-3 w-3" /> Всем
                </span>
              )}
              {homework.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  до {new Date(homework.dueDate).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </div>
        </div>

        {homework.description && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
              {homework.description}
            </p>
          </div>
        )}

        {homework.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={homework.imageUrl}
              alt="Условие"
              className="w-full h-auto"
            />
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Users className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">
          Сдачи ({homework.submissions.length})
        </h2>
      </div>

      {homework.submissions.length === 0 ? (
        <div className="text-center py-20 text-slate-500 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Пока никто не сдал</p>
        </div>
      ) : (
        <SubmissionsList submissions={homework.submissions as any} />
      )}
    </div>
  );
}