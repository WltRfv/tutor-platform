// lib/game-access.ts
import { prisma } from '@/lib/prisma';

export type AccessReason = 'not_found' | 'forbidden' | null;

export async function checkGameAccess(
  gameId: string,
  userId: string
): Promise<{ ok: true; reason: null } | { ok: false; reason: AccessReason }> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { published: true, topicId: true },
  });
  if (!game || !game.published) return { ok: false, reason: 'not_found' };

  if (game.topicId) {
    const unlock = await prisma.topicUnlock.findUnique({
      where: { topicId_userId: { topicId: game.topicId, userId } },
      select: { contentIds: true },
    });
    if (unlock) {
      const raw = unlock.contentIds as unknown as string[] | null | undefined;
      if (!Array.isArray(raw) || raw.includes(`game:${gameId}`)) {
        return { ok: true, reason: null };
      }
    }
  }

  const assigned = await prisma.assignedGame.findUnique({
    where: { gameId_userId: { gameId, userId } },
    select: { id: true },
  });
  if (assigned) return { ok: true, reason: null };

  return { ok: false, reason: 'forbidden' };
}