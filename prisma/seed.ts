import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
    ARMarkerType,
    Difficulty,
    HuntMode,
    HuntStatus,
    HuntVisibility,
    ParticipationStatus,
    PrismaClient,
    Role,
} from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export const IDS = {
    adminId: "00000000-0000-4000-8000-000000000001",
    partnerUserId: "11111111-1111-4111-8111-111111111111",
    partnerId: "22222222-2222-4222-8222-222222222222",
    player1Id: "33333333-3333-4333-8333-333333333333",
    player2Id: "44444444-4444-4444-8444-444444444444",
    player3Id: "55555555-5555-4555-8555-555555555555",

    mainHuntId: "66666666-6666-4666-8666-666666666666",
    startHuntId: "77777777-7777-4777-8777-777777777777",
    finishHuntId: "88888888-8888-4888-8888-888888888888",
    privateHuntId: "99999999-9999-4999-8999-999999999999",

    mainStep1Id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    mainStep2Id: "aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    startStep1Id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    startStep2Id: "bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    finishStep1Id: "ccccccc1-cccc-4ccc-8ccc-ccccccccccc1",
    finishStep2Id: "ccccccc2-cccc-4ccc-8ccc-ccccccccccc2",
    privateStep1Id: "ddddddd1-dddd-4ddd-8ddd-ddddddddddd1",
    privateStep2Id: "ddddddd2-dddd-4ddd-8ddd-ddddddddddd2",

    mainClue1Id: "eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1",
    mainClue2Id: "eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2",
    mainClue3Id: "eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3",
    mainClue4Id: "eeeeeee4-eeee-4eee-8eee-eeeeeeeeeee4",
    startClue1Id: "fffffff1-ffff-4fff-8fff-fffffffffff1",
    startClue2Id: "fffffff2-ffff-4fff-8fff-fffffffffff2",
    finishClue1Id: "12121212-1212-4212-8212-121212121211",
    finishClue2Id: "12121212-1212-4212-8212-121212121212",
    privateClue1Id: "13131313-1313-4313-8313-131313131311",
    privateClue2Id: "13131313-1313-4313-8313-131313131312",

    mainParticipationId: "14141414-1414-4414-8414-141414141414",
    finishParticipationId: "15151515-1515-4515-8515-151515151515",
    privateCompletedParticipationId: "16161616-1616-4616-8616-161616161616",

    mainProgress1Id: "17171717-1717-4717-8717-171717171711",
    mainProgress2Id: "17171717-1717-4717-8717-171717171712",
    finishProgress1Id: "18181818-1818-4818-8818-181818181811",
    finishProgress2Id: "18181818-1818-4818-8818-181818181812",
    privateCompletedProgress1Id: "19191919-1919-4919-8919-191919191911",
    privateCompletedProgress2Id: "19191919-1919-4919-8919-191919191912",

    privateAccessAttemptId: "20202020-2020-4020-8020-202020202020",
} as const;

async function main() {
    console.log("🌱 Starting deterministic seed...");

    const passwordHash = await bcrypt.hash("password123", 10);
    const now = new Date();

    await prisma.stepProgress.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.clue.deleteMany();
    await prisma.step.deleteMany();
    await prisma.huntAccessAttempt.deleteMany();
    await prisma.hunt.deleteMany();
    await prisma.userStats.deleteMany();
    await prisma.partner.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
        data: {
            id: IDS.adminId,
            email: "admin@lootopia.local",
            username: "admin_fixed",
            passwordHash,
            role: Role.ADMIN,
        },
    });

    await prisma.user.create({
        data: {
            id: IDS.partnerUserId,
            email: "partner@lootopia.local",
            username: "partner_fixed",
            passwordHash,
            role: Role.PARTNER,
        },
    });

    await prisma.partner.create({
        data: {
            id: IDS.partnerId,
            userId: IDS.partnerUserId,
            companyName: "Lootopia Demo Partner",
        },
    });

    for (const player of [
        {
            id: IDS.player1Id,
            email: "player1@lootopia.local",
            username: "player_one",
            totalPoints: 120,
            huntsCompleted: 1,
            level: 2,
        },
        {
            id: IDS.player2Id,
            email: "player2@lootopia.local",
            username: "player_two",
            totalPoints: 75,
            huntsCompleted: 1,
            level: 2,
        },
        {
            id: IDS.player3Id,
            email: "player3@lootopia.local",
            username: "player_three",
            totalPoints: 180,
            huntsCompleted: 1,
            level: 3,
        },
    ]) {
        await prisma.user.create({
            data: {
                id: player.id,
                email: player.email,
                username: player.username,
                passwordHash,
                role: Role.PLAYER,
            },
        });

        await prisma.userStats.create({
            data: {
                userId: player.id,
                totalPoints: player.totalPoints,
                huntsCompleted: player.huntsCompleted,
                level: player.level,
            },
        });
    }

    await prisma.hunt.create({
        data: {
            id: IDS.mainHuntId,
            title: "Le parcours du Vieux-Port",
            description: "Chasse publique publiée avec deux étapes non commencées.",
            location: "Marseille",
            difficulty: Difficulty.MEDIUM,
            visibility: HuntVisibility.PUBLIC,
            status: HuntStatus.PUBLISHED,
            isDeleted: false,
            startLat: 43.2965,
            startLng: 5.3698,
            createdById: IDS.partnerUserId,
            mode: HuntMode.PARTNER,
            partnerId: IDS.partnerId,
            steps: {
                create: [
                    {
                        id: IDS.mainStep1Id,
                        title: "Le phare du port",
                        description: "Trouve le point de départ près du phare.",
                        latitude: 43.2958,
                        longitude: 5.3704,
                        radiusMeters: 30,
                        orderIndex: 0,
                        pointsReward: 50,
                        arMarkerType: ARMarkerType.IMAGE,
                        arAssetUrl: "https://example.com/ar/phare.png",
                        clues: {
                            create: [
                                {
                                    id: IDS.mainClue1Id,
                                    content: "Cherche une lumière qui guide les marins.",
                                    penaltyPoints: 5,
                                    orderIndex: 0,
                                },
                                {
                                    id: IDS.mainClue2Id,
                                    content: "Regarde près de l'eau et des bateaux.",
                                    penaltyPoints: 10,
                                    orderIndex: 1,
                                },
                            ],
                        },
                    },
                    {
                        id: IDS.mainStep2Id,
                        title: "La jetée",
                        description: "Avance jusqu'à l'extrémité de la jetée.",
                        latitude: 43.2946,
                        longitude: 5.3712,
                        radiusMeters: 25,
                        orderIndex: 1,
                        pointsReward: 70,
                        arMarkerType: ARMarkerType.PATTERN,
                        arAssetUrl: "https://example.com/ar/jetee-pattern.png",
                        clues: {
                            create: [
                                {
                                    id: IDS.mainClue3Id,
                                    content: "C'est un long passage qui s'avance sur l'eau.",
                                    penaltyPoints: 5,
                                    orderIndex: 0,
                                },
                                {
                                    id: IDS.mainClue4Id,
                                    content: "Tu marches vers le large.",
                                    penaltyPoints: 10,
                                    orderIndex: 1,
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    await prisma.hunt.create({
        data: {
            id: IDS.startHuntId,
            title: "Balade du Panier",
            description: "Chasse publique publiée sans participation existante.",
            location: "Marseille",
            difficulty: Difficulty.EASY,
            visibility: HuntVisibility.PUBLIC,
            status: HuntStatus.PUBLISHED,
            isDeleted: false,
            startLat: 43.3009,
            startLng: 5.3675,
            createdById: IDS.player1Id,
            mode: HuntMode.COMMUNITY,
            steps: {
                create: [
                    {
                        id: IDS.startStep1Id,
                        title: "La place cachée",
                        description: "Repère la petite place colorée.",
                        latitude: 43.3008,
                        longitude: 5.3656,
                        radiusMeters: 20,
                        orderIndex: 0,
                        pointsReward: 25,
                        clues: {
                            create: [
                                {
                                    id: IDS.startClue1Id,
                                    content: "Cherche une place discrète entre les ruelles.",
                                    penaltyPoints: 3,
                                    orderIndex: 0,
                                },
                            ],
                        },
                    },
                    {
                        id: IDS.startStep2Id,
                        title: "L'escalier peint",
                        description: "Trouve l'escalier décoré du quartier.",
                        latitude: 43.3013,
                        longitude: 5.3659,
                        radiusMeters: 20,
                        orderIndex: 1,
                        pointsReward: 35,
                        clues: {
                            create: [
                                {
                                    id: IDS.startClue2Id,
                                    content: "Cherche des couleurs vives sur les marches.",
                                    penaltyPoints: 4,
                                    orderIndex: 0,
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    await prisma.hunt.create({
        data: {
            id: IDS.finishHuntId,
            title: "Le parc Borély express",
            description: "Chasse publique publiée avec une participation prête à être finalisée.",
            location: "Marseille",
            difficulty: Difficulty.EASY,
            visibility: HuntVisibility.PUBLIC,
            status: HuntStatus.PUBLISHED,
            isDeleted: false,
            startLat: 43.2699,
            startLng: 5.3878,
            createdById: IDS.partnerUserId,
            mode: HuntMode.PARTNER,
            partnerId: IDS.partnerId,
            steps: {
                create: [
                    {
                        id: IDS.finishStep1Id,
                        title: "L'entrée du parc",
                        description: "Trouve l'entrée principale.",
                        latitude: 43.2699,
                        longitude: 5.3878,
                        radiusMeters: 20,
                        orderIndex: 0,
                        pointsReward: 30,
                        clues: {
                            create: [
                                {
                                    id: IDS.finishClue1Id,
                                    content: "Commence là où les visiteurs entrent.",
                                    penaltyPoints: 3,
                                    orderIndex: 0,
                                },
                            ],
                        },
                    },
                    {
                        id: IDS.finishStep2Id,
                        title: "Le bassin",
                        description: "Repère le grand bassin du parc.",
                        latitude: 43.2707,
                        longitude: 5.3885,
                        radiusMeters: 20,
                        orderIndex: 1,
                        pointsReward: 45,
                        clues: {
                            create: [
                                {
                                    id: IDS.finishClue2Id,
                                    content: "Cherche l'eau calme au milieu du parc.",
                                    penaltyPoints: 4,
                                    orderIndex: 0,
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    await prisma.hunt.create({
        data: {
            id: IDS.privateHuntId,
            title: "Le centre historique",
            description: "Chasse privée publiée avec code d'accès et participation déjà terminée.",
            location: "Aix-en-Provence",
            difficulty: Difficulty.HARD,
            visibility: HuntVisibility.PRIVATE,
            status: HuntStatus.PUBLISHED,
            accessCode: "12345678",
            isDeleted: false,
            startLat: 43.5297,
            startLng: 5.4474,
            createdById: IDS.partnerUserId,
            mode: HuntMode.PARTNER,
            partnerId: IDS.partnerId,
            steps: {
                create: [
                    {
                        id: IDS.privateStep1Id,
                        title: "La fontaine ancienne",
                        description: "Trouve la vieille fontaine de la place.",
                        latitude: 43.5299,
                        longitude: 5.4471,
                        radiusMeters: 18,
                        orderIndex: 0,
                        pointsReward: 80,
                        clues: {
                            create: [
                                {
                                    id: IDS.privateClue1Id,
                                    content: "L'eau y coule depuis longtemps.",
                                    penaltyPoints: 6,
                                    orderIndex: 0,
                                },
                            ],
                        },
                    },
                    {
                        id: IDS.privateStep2Id,
                        title: "La ruelle cachée",
                        description: "Trouve la ruelle discrète près de la place.",
                        latitude: 43.5302,
                        longitude: 5.4479,
                        radiusMeters: 15,
                        orderIndex: 1,
                        pointsReward: 100,
                        arMarkerType: ARMarkerType.MODEL_3D,
                        arAssetUrl: "https://example.com/ar/ruelle.glb",
                        clues: {
                            create: [
                                {
                                    id: IDS.privateClue2Id,
                                    content: "Cherche un passage étroit et discret.",
                                    penaltyPoints: 8,
                                    orderIndex: 0,
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });

    await prisma.participation.create({
        data: {
            id: IDS.mainParticipationId,
            userId: IDS.player1Id,
            huntId: IDS.mainHuntId,
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 0,
            stepProgress: {
                create: [
                    {
                        id: IDS.mainProgress1Id,
                        stepId: IDS.mainStep1Id,
                        isCompleted: false,
                        cluesUsed: 0,
                        pointsEarned: 0,
                    },
                    {
                        id: IDS.mainProgress2Id,
                        stepId: IDS.mainStep2Id,
                        isCompleted: false,
                        cluesUsed: 0,
                        pointsEarned: 0,
                    },
                ],
            },
        },
    });

    await prisma.participation.create({
        data: {
            id: IDS.finishParticipationId,
            userId: IDS.player2Id,
            huntId: IDS.finishHuntId,
            status: ParticipationStatus.IN_PROGRESS,
            totalScore: 75,
            stepProgress: {
                create: [
                    {
                        id: IDS.finishProgress1Id,
                        stepId: IDS.finishStep1Id,
                        isCompleted: true,
                        cluesUsed: 0,
                        pointsEarned: 30,
                        completedAt: now,
                    },
                    {
                        id: IDS.finishProgress2Id,
                        stepId: IDS.finishStep2Id,
                        isCompleted: true,
                        cluesUsed: 0,
                        pointsEarned: 45,
                        completedAt: now,
                    },
                ],
            },
        },
    });

    await prisma.participation.create({
        data: {
            id: IDS.privateCompletedParticipationId,
            userId: IDS.player3Id,
            huntId: IDS.privateHuntId,
            status: ParticipationStatus.COMPLETED,
            totalScore: 180,
            completedAt: now,
            stepProgress: {
                create: [
                    {
                        id: IDS.privateCompletedProgress1Id,
                        stepId: IDS.privateStep1Id,
                        isCompleted: true,
                        cluesUsed: 0,
                        pointsEarned: 80,
                        completedAt: now,
                    },
                    {
                        id: IDS.privateCompletedProgress2Id,
                        stepId: IDS.privateStep2Id,
                        isCompleted: true,
                        cluesUsed: 1,
                        pointsEarned: 100,
                        completedAt: now,
                    },
                ],
            },
        },
    });

    await prisma.huntAccessAttempt.create({
        data: {
            id: IDS.privateAccessAttemptId,
            userId: IDS.player2Id,
            huntId: IDS.privateHuntId,
            failedAttempts: 2,
        },
    });

    console.log("✅ Deterministic seed completed.");
    console.table({
        adminId: IDS.adminId,
        partnerUserId: IDS.partnerUserId,
        partnerId: IDS.partnerId,
        player1Id: IDS.player1Id,
        player2Id: IDS.player2Id,
        player3Id: IDS.player3Id,
        mainHuntId: IDS.mainHuntId,
        startHuntId: IDS.startHuntId,
        finishHuntId: IDS.finishHuntId,
        privateHuntId: IDS.privateHuntId,
        mainParticipationId: IDS.mainParticipationId,
        finishParticipationId: IDS.finishParticipationId,
        privateCompletedParticipationId: IDS.privateCompletedParticipationId,
    });
}

main()
.catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});