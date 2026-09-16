import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TestRunner } from '@/components/student/TestRunner';

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const test = await prisma.test.findUnique({ where: { id } });
  if (!test || !test.published) notFound();

  return <TestRunner test={test as any} />;
}