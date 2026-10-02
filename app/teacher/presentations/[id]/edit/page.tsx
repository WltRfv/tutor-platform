import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PresentationForm } from '@/components/teacher/PresentationForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;
  const p = await prisma.presentation.findFirst({
    where: { id, authorId: (session.user as any).id },
    include: { slides: { orderBy: { order: 'asc' } } },
  });
  if (!p) notFound();

  return (
    <PresentationForm
      presentationId={p.id}
      initial={{
        title: p.title,
        subjectId: p.subjectId,
        topicId: p.topicId || '',
        imageUrl: p.imageUrl || '',
        published: p.published,
        slides: p.slides.map((s) => ({
          id: s.id,
          title: s.title || '',
          content: s.content,
          imageUrl: s.imageUrl || '',
        })),
      }}
    />
  );
}