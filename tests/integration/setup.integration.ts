import { prisma } from "@/lib/db/prisma";

afterAll(async () => {
    await prisma.$disconnect();
});