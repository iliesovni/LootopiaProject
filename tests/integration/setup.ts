import { prisma } from "@/lib/db/prisma";

export async function resetDatabase() {
    await prisma.stepProgress.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.clue.deleteMany();
    await prisma.step.deleteMany();
    await prisma.huntAccessAttempt.deleteMany();
    await prisma.hunt.deleteMany();
    await prisma.userStats.deleteMany();
    await prisma.partner.deleteMany();
    await prisma.user.deleteMany();
}