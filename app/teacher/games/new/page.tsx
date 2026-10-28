
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { GameEditor } from '@/components/teacher/GameEditor';
import type { GameType } from '@/types/game';

export const dynamic = 'force-dynamic';

export default async function NewGamePage() {
  const session = await auth();

  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== 'TEACHER') redirect('/');

  return <GameEditor defaultType={'CARDS' as GameType} />;
}
