import { prisma } from "@/lib/db/prisma";
import { getMyParticipations } from "@/lib/services/participation.service";
import { Difficulty, HuntMode, HuntStatus, HuntVisibility, ParticipationStatus, Role } from "@prisma/client";

describe("integration - participation read", () => {
    async function createUser(unique: string, role: Role = Role.PLAYER) {
        return prisma.user.create({
            data: {
                email: `${ unique }@integration.local`,
                username: unique,
                passwordHash: "hashed-password",
                role,
            },
        });
    }

    async function createHunt(unique: string, options?: {
        isDeleted?: boolean;
        ownerId?: string;
    }) {
        const owner =
            options?.ownerId
                ? { id: options.ownerId }
                : await createUser(`owner-${ unique }`);

        return prisma.hunt.create({
            data: {
                title: `Participation Hunt ${ unique }`,
                description: "Test hunt",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: owner.id,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.PUBLISHED,
                visibility: HuntVisibility.PUBLIC,
                isDeleted: options?.isDeleted ?? false,
            },
        });
    }

    async function createParticipation(unique: string, options: {
        userId: string;
        status: ParticipationStatus;
        huntId: string;
        totalScore?: number;
    }) {
        return prisma.participation.create({
            data: {
                userId: options.userId,
                huntId: options.huntId,
                status: options.status,
                totalScore: options.totalScore ?? 0,
            },
        });
    }

    it("should return only participations of the current user", async () => {
        // Arrange
        const unique = `my-participations-${ Date.now() }`;

        const userA = await createUser(`userA-${ unique }`);
        const userB = await createUser(`userB-${ unique }`);

        const hunt1 = await createHunt(`${ unique }-hunt1`);
        const hunt2 = await createHunt(`${ unique }-hunt2`);
        const hunt3 = await createHunt(`${ unique }-hunt3`);
        const hunt4 = await createHunt(`${ unique }-hunt4`);

        const participationA1 = await createParticipation(`${ unique }-p1`, {
            userId: userA.id,
            huntId: hunt1.id,
            status: ParticipationStatus.IN_PROGRESS,
        });

        const participationA2 = await createParticipation(`${ unique }-p2`, {
            userId: userA.id,
            huntId: hunt2.id,
            status: ParticipationStatus.COMPLETED,
            totalScore: 120,
        });

        const participationA3 = await createParticipation(`${ unique }-p3`, {
            userId: userA.id,
            huntId: hunt3.id,
            status: ParticipationStatus.ABANDONED,
        });

        const participationB1 = await createParticipation(`${ unique }-p4`, {
            userId: userB.id,
            huntId: hunt4.id,
            status: ParticipationStatus.IN_PROGRESS,
        });

        // Act
        const participations = await getMyParticipations(userA.id);

        // Assert
        const participationIds = participations.map((p) => p.id);

        expect(participationIds).toContain(participationA1.id);
        expect(participationIds).toContain(participationA2.id);
        expect(participationIds).toContain(participationA3.id);

        expect(participationIds).not.toContain(participationB1.id);
    });

    it("should filter participations by status", async () => {
        // Arrange
        const unique = `my-participations-filter-${ Date.now() }`;

        const user = await createUser(`user-${ unique }`);

        const hunt1 = await createHunt(`${ unique }-hunt1`);
        const hunt2 = await createHunt(`${ unique }-hunt2`);
        const hunt3 = await createHunt(`${ unique }-hunt3`);

        const inProgress = await createParticipation(`${ unique }-p1`, {
            userId: user.id,
            huntId: hunt1.id,
            status: ParticipationStatus.IN_PROGRESS,
        });

        const completed = await createParticipation(`${ unique }-p2`, {
            userId: user.id,
            huntId: hunt2.id,
            status: ParticipationStatus.COMPLETED,
            totalScore: 150,
        });

        const abandoned = await createParticipation(`${ unique }-p3`, {
            userId: user.id,
            huntId: hunt3.id,
            status: ParticipationStatus.ABANDONED,
        });

        // Act
        const participations = await getMyParticipations(user.id, {
            status: ParticipationStatus.IN_PROGRESS,
        });

        // Assert
        const participationIds = participations.map((p) => p.id);

        expect(participationIds).toContain(inProgress.id);
        expect(participationIds).not.toContain(completed.id);
        expect(participationIds).not.toContain(abandoned.id);
    });

    it("should keep participations visible even if the related hunt is deleted", async () => {
        // Arrange
        const unique = `my-participations-deleted-hunt-${ Date.now() }`;

        const user = await createUser(`user-${ unique }`);
        const hunt = await createHunt(`${ unique }-hunt`, {
            isDeleted: true,
        });

        const participation = await createParticipation(`${ unique }-p1`, {
            userId: user.id,
            huntId: hunt.id,
            status: ParticipationStatus.COMPLETED,
            totalScore: 90,
        });

        // Act
        const participations = await getMyParticipations(user.id);

        // Assert
        const found = participations.find((p) => p.id === participation.id);

        expect(found).toBeDefined();
        expect(found?.hunt.id).toBe(hunt.id);
        expect(found?.status).toBe(ParticipationStatus.COMPLETED);
        expect(found?.totalScore).toBe(90);
    });

    it("should not expose clues in participation profile listing", async () => {
        // Arrange
        const unique = `my-participations-no-clues-${ Date.now() }`;
        const user = await createUser(`user-${ unique }`);
        const hunt = await createHunt(`${ unique }-hunt`);

        const participation = await createParticipation(`${ unique }-p1`, {
            userId: user.id,
            huntId: hunt.id,
            status: ParticipationStatus.IN_PROGRESS,
        });

        // Act
        const participations = await getMyParticipations(user.id);

        // Assert
        const found = participations.find((p) => p.id === participation.id);
        expect(found).toBeDefined();

        for (const stepProgress of found?.stepProgress ?? []) {
            expect((stepProgress.step as any)?.clues).toBeUndefined();
        }
    });
});