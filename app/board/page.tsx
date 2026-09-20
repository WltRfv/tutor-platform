import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BoardClient } from '@/components/shared/BoardClient';

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string; from?: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { lesson, from } = await searchParams;
  const role = (session.user as any).role;

  // Куда возвращаться по кнопке «Назад»
  const backUrl =
    from === 'lesson'
      ? role === 'TEACHER'
        ? '/teacher/calendar'
        : '/student/calendar'
      : role === 'TEACHER'
      ? '/teacher'
      : '/student';

  return (
    <BoardClient
      userName={session.user?.name || 'Гость'}
      lessonId={lesson || null}
      backUrl={backUrl}
    />
  );
}