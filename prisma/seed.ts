import { PrismaClient, Role, Difficulty, ParticipationStatus, ARMarkerType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    // --- USERS ---
    const password = await bcrypt.hash("password123", 10);

    const partnerUser = await prisma.user.create({
        data: {
            email: "partner@example.com",
            username: "partner1",
            passwordHash: password,
            role: Role.PARTNER,
            partner: {
                create: {
                    organizationName: "Out of Cache",
                    description: "Agence digitale spécialisée dans les expériences ludiques",
                    website: "https://outofcache.example.com",
                },
            },
        },
    });

    const playerUser = await prisma.user.create({
        data: {
            email: "player@example.com",
            username: "player1",
            passwordHash: password,
            role: Role.PLAYER,
            stats: {
                create: {},
            },
        },
    });

    // --- HUNT ---
    const hunt = await prisma.hunt.create({
        data: {
            title: "Chasse au Trésor du Vieux Port",
            description: "Explorez les secrets du Vieux Port de Marseille",
            location: "Marseille",
            difficulty: Difficulty.MEDIUM,
            startLat: 43.2965,
            startLng: 5.3698,
            createdById: partnerUser.id,
        },
    });

    // --- STEPS ---
    const step1 = await prisma.step.create({
        data: {
            title: "Le Phare",
            description: "Trouvez le vieux phare du port",
            latitude: 43.295,
            longitude: 5.37,
            radiusMeters: 30,
            orderIndex: 1,
            pointsReward: 50,
            arMarkerType: ARMarkerType.IMAGE,
            arAssetUrl: "https://example.com/ar/phare.png",
            huntId: hunt.id,
            clues: {
                create: [
                    { content: "Cherche une lumière qui guide les marins", penaltyPoints: 5, orderIndex: 1 },
                    { content: "Il est près de l'eau", penaltyPoints: 5, orderIndex: 2 },
                ],
            },
        },
    });

    const step2 = await prisma.step.create({
        data: {
            title: "La Jetée",
            description: "Rendez-vous au bout de la jetée",
            latitude: 43.294,
            longitude: 5.368,
            radiusMeters: 25,
            orderIndex: 2,
            pointsReward: 70,
            huntId: hunt.id,
            clues: {
                create: [
                    { content: "C'est un long chemin sur l'eau", penaltyPoints: 5, orderIndex: 1 },
                ],
            },
        },
    });

    // --- PARTICIPATION ---
    const participation = await prisma.participation.create({
        data: {
            userId: playerUser.id,
            huntId: hunt.id,
            status: ParticipationStatus.IN_PROGRESS,
            stepProgress: {
                create: [
                    {
                        stepId: step1.id,
                        isCompleted: true,
                        pointsEarned: 50,
                        cluesUsed: 1,
                        completedAt: new Date(),
                    },
                    {
                        stepId: step2.id,
                        isCompleted: false,
                        pointsEarned: 0,
                        cluesUsed: 0,
                    },
                ],
            },
        },
    });

    // --- UPDATE USER STATS ---
    await prisma.userStats.update({
        where: { userId: playerUser.id },
        data: {
            totalPoints: 50,
            huntsCompleted: 0,
            level: 1,
        },
    });

    console.log("🌱 Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
