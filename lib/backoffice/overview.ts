import { prisma } from "@/lib/db/prisma";
import { HuntStatus, ParticipationStatus } from "@prisma/client";

const huntWhere = (userId: string) => ({
  createdById: userId,
  isDeleted: false,
});

export async function getBackofficeOverview(userId: string) {
  const where = huntWhere(userId);
  const participationWhere = { hunt: where };

  const [
    totalHunts,
    published,
    drafts,
    totalParticipations,
    completedParticipations,
    recentHunts,
    recentParticipations,
    playerCount,
    draftHunts,
  ] = await Promise.all([
    prisma.hunt.count({ where }),
    prisma.hunt.count({ where: { ...where, status: HuntStatus.PUBLISHED } }),
    prisma.hunt.count({ where: { ...where, status: HuntStatus.DRAFT } }),
    prisma.participation.count({ where: participationWhere }),
    prisma.participation.count({
      where: { ...participationWhere, status: ParticipationStatus.COMPLETED },
    }),
    prisma.hunt.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        location: true,
        _count: { select: { steps: true, participations: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.participation.findMany({
      where: participationWhere,
      select: {
        id: true,
        status: true,
        totalScore: true,
        startedAt: true,
        completedAt: true,
        user: { select: { username: true } },
        hunt: { select: { id: true, title: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
    prisma.participation.groupBy({
      by: ["userId"],
      where: participationWhere,
    }),
    prisma.hunt.findMany({
      where: { ...where, status: HuntStatus.DRAFT },
      select: {
        id: true,
        title: true,
        _count: { select: { steps: true } },
      },
    }),
  ]);

  const readyToPublish = draftHunts.filter((h) => h._count.steps >= 2);

  return {
    stats: {
      totalHunts,
      published,
      drafts,
      totalParticipations,
      completed: completedParticipations,
      uniquePlayers: playerCount.length,
    },
    recentHunts,
    recentParticipations,
    readyToPublish,
  };
}

export async function getHuntParticipations(userId: string) {
  return prisma.participation.findMany({
    where: { hunt: huntWhere(userId) },
    select: {
      id: true,
      status: true,
      totalScore: true,
      startedAt: true,
      completedAt: true,
      user: { select: { username: true, email: true } },
      hunt: { select: { id: true, title: true, location: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}
