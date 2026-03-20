import "dotenv/config";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    ParticipationStatus,
    PrismaClient,
    Role,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seed...");

    const password = await bcrypt.hash("password123", 10);

    await prisma.stepProgress.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.clue.deleteMany();
    await prisma.step.deleteMany();
    await prisma.hunt.deleteMany();
    await prisma.userStats.deleteMany();
    await prisma.partner.deleteMany();
    await prisma.user.deleteMany();

    const partnerUser1 = await prisma.user.create({
        data: {
            email: "partner@example.com",
            username: "partner1",
            passwordHash: password,
            role: Role.PARTNER,
            partner: {
                create: {
                    companyName: "Out of Cache",
                },
            },
        },
        include: {
            partner: true,
        },
    });

    const partnerUser2 = await prisma.user.create({
        data: {
            email: "partner2@example.com",
            username: "partner2",
            passwordHash: password,
            role: Role.PARTNER,
            partner: {
                create: {
                    companyName: "Treasure Makers",
                },
            },
        },
        include: {
            partner: true,
        },
    });

    const player1 = await prisma.user.create({
        data: {
            email: "player@example.com",
            username: "player1",
            passwordHash: password,
            role: Role.PLAYER,
            stats: {
                create: {
                    totalPoints: 120,
                    huntsCompleted: 1,
                    level: 2,
                },
            },
        },
    });

    const player2 = await prisma.user.create({
        data: {
            email: "player2@example.com",
            username: "player2",
            passwordHash: password,
            role: Role.PLAYER,
            stats: {
                create: {
                    totalPoints: 40,
                    huntsCompleted: 0,
                    level: 1,
                },
            },
        },
    });

    const player3 = await prisma.user.create({
        data: {
            email: "player3@example.com",
            username: "player3",
            passwordHash: password,
            role: Role.PLAYER,
            stats: {
                create: {
                    totalPoints: 200,
                    huntsCompleted: 2,
                    level: 3,
                },
            },
        },
    });

    const hunt1 = await prisma.hunt.create({
        data: {
            title: "Chasse au Trésor du Vieux Port",
            description: "Explorez les secrets du Vieux Port de Marseille",
            location: "Marseille",
            difficulty: Difficulty.MEDIUM,
            isPublic: true,
            startLat: 43.3006,
            startLng: 5.367,
            createdById: partnerUser1.id,
            mode: HuntMode.PARTNER,
            partnerId: partnerUser1.partner!.id,
        },
    });

    const hunt2 = await prisma.hunt.create({
        data: {
            title: "Mystères du Parc Borély",
            description:
                "Une aventure familiale dans l'un des plus beaux parcs de Marseille",
            location: "Marseille",
            difficulty: Difficulty.EASY,
            isPublic: true,
            startLat: 43.3006,
            startLng: 5.367,
            createdById: partnerUser1.id,
            mode: HuntMode.PARTNER,
            partnerId: partnerUser1.partner!.id,
        },
    });

    const hunt3 = await prisma.hunt.create({
        data: {
            title: "Les Secrets du Centre Historique",
            description: "Parcours urbain à énigmes dans les ruelles anciennes",
            location: "Aix-en-Provence",
            difficulty: Difficulty.HARD,
            isPublic: false,
            startLat: 54.36,
            startLng: 10.67,
            createdById: partnerUser2.id,
            mode: HuntMode.PARTNER,
            partnerId: partnerUser2.partner!.id,
        },
    });

    const communityHunt = await prisma.hunt.create({
        data: {
            title: "Balade Mystère au Panier",
            description: "Une chasse communautaire créée par un joueur dans le quartier du Panier",
            location: "Marseille",
            difficulty: Difficulty.EASY,
            isPublic: true,
            startLat: 43.3006,
            startLng: 5.367,
            createdById: player1.id,
            mode: HuntMode.COMMUNITY,
        },
    });

    const step1H1 = await prisma.step.create({
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
            huntId: hunt1.id,
            clues: {
                create: [
                    {
                        content: "Cherche une lumière qui guide les marins",
                        penaltyPoints: 5,
                        orderIndex: 1,
                    },
                    {
                        content: "Il est près de l'eau",
                        penaltyPoints: 5,
                        orderIndex: 2,
                    },
                ],
            },
        },
    });

    const step2H1 = await prisma.step.create({
        data: {
            title: "La Jetée",
            description: "Rendez-vous au bout de la jetée",
            latitude: 43.294,
            longitude: 5.368,
            radiusMeters: 25,
            orderIndex: 2,
            pointsReward: 70,
            huntId: hunt1.id,
            clues: {
                create: [
                    {
                        content: "C'est un long chemin sur l'eau",
                        penaltyPoints: 5,
                        orderIndex: 1,
                    },
                    {
                        content: "Tu avances vers le large",
                        penaltyPoints: 10,
                        orderIndex: 2,
                    },
                ],
            },
        },
    });

    const step1H2 = await prisma.step.create({
        data: {
            title: "L'entrée du parc",
            description: "Trouve l'entrée principale du parc Borély",
            latitude: 43.2699,
            longitude: 5.3878,
            radiusMeters: 20,
            orderIndex: 1,
            pointsReward: 30,
            huntId: hunt2.id,
            clues: {
                create: [
                    {
                        content: "Commence là où les visiteurs entrent",
                        penaltyPoints: 3,
                        orderIndex: 1,
                    },
                ],
            },
        },
    });

    const step2H2 = await prisma.step.create({
        data: {
            title: "Le bassin",
            description: "Repère le grand bassin du parc",
            latitude: 43.2707,
            longitude: 5.3885,
            radiusMeters: 20,
            orderIndex: 2,
            pointsReward: 45,
            arMarkerType: ARMarkerType.PATTERN,
            arAssetUrl: "https://example.com/ar/bassin-pattern.png",
            huntId: hunt2.id,
            clues: {
                create: [
                    {
                        content: "Cherche l'eau calme au milieu du parc",
                        penaltyPoints: 4,
                        orderIndex: 1,
                    },
                    {
                        content: "Des canards s'y promènent parfois",
                        penaltyPoints: 4,
                        orderIndex: 2,
                    },
                ],
            },
        },
    });

    const step3H2 = await prisma.step.create({
        data: {
            title: "Le kiosque",
            description: "Trouve le kiosque central du parc",
            latitude: 43.2705,
            longitude: 5.3882,
            radiusMeters: 25,
            orderIndex: 3,
            pointsReward: 60,
            arMarkerType: ARMarkerType.IMAGE,
            arAssetUrl: "https://example.com/ar/kiosque.png",
            huntId: hunt2.id,
            clues: {
                create: [
                    {
                        content: "Cherche une structure ronde et ouverte",
                        penaltyPoints: 5,
                        orderIndex: 1,
                    },
                ],
            },
        },
    });

    const step1H3 = await prisma.step.create({
        data: {
            title: "La fontaine ancienne",
            description: "Trouve la vieille fontaine de la place",
            latitude: 43.5299,
            longitude: 5.4471,
            radiusMeters: 18,
            orderIndex: 1,
            pointsReward: 80,
            huntId: hunt3.id,
            clues: {
                create: [
                    {
                        content: "L'eau y coule depuis longtemps",
                        penaltyPoints: 6,
                        orderIndex: 1,
                    },
                ],
            },
        },
    });

    const step2H3 = await prisma.step.create({
        data: {
            title: "La ruelle cachée",
            description: "Trouve la ruelle discrète près de la place",
            latitude: 43.5302,
            longitude: 5.4479,
            radiusMeters: 15,
            orderIndex: 2,
            pointsReward: 100,
            arMarkerType: ARMarkerType.MODEL_3D,
            arAssetUrl: "https://example.com/ar/ruelle.glb",
            huntId: hunt3.id,
            clues: {
                create: [
                    {
                        content: "Cherche un passage étroit et discret",
                        penaltyPoints: 8,
                        orderIndex: 1,
                    },
                    {
                        content: "Les murs y sont très proches",
                        penaltyPoints: 8,
                        orderIndex: 2,
                    },
                ],
            },
        },
    });

    await prisma.step.create({
        data: {
            title: "La place cachée",
            description: "Trouve la petite place colorée du Panier",
            latitude: 43.3008,
            longitude: 5.3656,
            radiusMeters: 20,
            orderIndex: 1,
            pointsReward: 25,
            huntId: communityHunt.id,
            clues: {
                create: [
                    {
                        content: "Cherche une place discrète entre les ruelles",
                        penaltyPoints: 3,
                        orderIndex: 1,
                    },
                ],
            },
        },
    });

    await prisma.participation.create({
        data: {
            userId: player1.id,
            huntId: hunt1.id,
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 50,
            stepProgress: {
                create: [
                    {
                        stepId: step1H1.id,
                        isCompleted: true,
                        pointsEarned: 50,
                        cluesUsed: 1,
                        completedAt: new Date(),
                    },
                    {
                        stepId: step2H1.id,
                        isCompleted: false,
                        pointsEarned: 0,
                        cluesUsed: 0,
                    },
                ],
            },
        },
    });

    await prisma.participation.create({
        data: {
            userId: player2.id,
            huntId: hunt2.id,
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 30,
            stepProgress: {
                create: [
                    {
                        stepId: step1H2.id,
                        isCompleted: true,
                        pointsEarned: 30,
                        cluesUsed: 0,
                        completedAt: new Date(),
                    },
                    {
                        stepId: step2H2.id,
                        isCompleted: false,
                        pointsEarned: 0,
                        cluesUsed: 1,
                    },
                    {
                        stepId: step3H2.id,
                        isCompleted: false,
                        pointsEarned: 0,
                        cluesUsed: 0,
                    },
                ],
            },
        },
    });

    await prisma.participation.create({
        data: {
            userId: player3.id,
            huntId: hunt3.id,
            status: ParticipationStatus.COMPLETED,
            totalScore: 180,
            completedAt: new Date(),
            stepProgress: {
                create: [
                    {
                        stepId: step1H3.id,
                        isCompleted: true,
                        pointsEarned: 80,
                        cluesUsed: 0,
                        completedAt: new Date(),
                    },
                    {
                        stepId: step2H3.id,
                        isCompleted: true,
                        pointsEarned: 100,
                        cluesUsed: 1,
                        completedAt: new Date(),
                    },
                ],
            },
        },
    });

    console.log("🌱 Seed completed successfully!");
}

main()
    .then(() => {
        console.log("🌱 Seed completed successfully!");
    })
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });