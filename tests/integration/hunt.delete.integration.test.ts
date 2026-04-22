import { prisma } from "@/lib/db/prisma";
import { deleteHunt, HuntForbiddenError, HuntNotFoundError } from "@/lib/services/hunt.service";
import { Difficulty, HuntMode, HuntStatus, HuntVisibility, Role } from "@prisma/client";

describe("integration - hunt delete", () => {
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

    async function createOwnedHunt(unique: string, ownerId: string) {
        return prisma.hunt.create({
            data: {
                title: `Delete Hunt ${ unique }`,
                description: "Test hunt delete",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: ownerId,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.DRAFT,
                visibility: HuntVisibility.PUBLIC,
                isDeleted: false,
            },
        });
    }

    it("should allow the owner to soft delete a hunt", async () => {
        // Arrange
        const unique = `hunt-delete-owner-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`, Role.PLAYER);
        const hunt = await createOwnedHunt(unique, owner.id);

        // Act
        await deleteHunt({
            huntId: hunt.id,
            currentUserId: owner.id,
            currentUserRole: owner.role,
        });

        // Assert
        const deleted = await prisma.hunt.findUnique({
            where: { id: hunt.id },
            select: { id: true, isDeleted: true },
        });

        expect(deleted).not.toBeNull();
        expect(deleted?.isDeleted).toBe(true);
    });

    it("should reject delete for a non-owner non-admin user", async () => {
        // Arrange
        const unique = `hunt-delete-forbidden-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`, Role.PLAYER);
        const otherUser = await createUser(`other-${ unique }`, Role.PLAYER);
        const hunt = await createOwnedHunt(unique, owner.id);

        // Act + Assert
        await expect(
            deleteHunt({
                huntId: hunt.id,
                currentUserId: otherUser.id,
                currentUserRole: otherUser.role,
            }),
        ).rejects.toThrow(HuntForbiddenError);

        const unchanged = await prisma.hunt.findUnique({
            where: { id: hunt.id },
            select: { isDeleted: true },
        });

        expect(unchanged?.isDeleted).toBe(false);
    });

    it("should allow an admin to delete a hunt they do not own", async () => {
        // Arrange
        const unique = `hunt-delete-admin-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`, Role.PLAYER);
        const admin = await createUser(`admin-${ unique }`, Role.ADMIN);
        const hunt = await createOwnedHunt(unique, owner.id);

        // Act
        await deleteHunt({
            huntId: hunt.id,
            currentUserId: admin.id,
            currentUserRole: admin.role,
        });

        // Assert
        const deleted = await prisma.hunt.findUnique({
            where: { id: hunt.id },
            select: { isDeleted: true },
        });

        expect(deleted?.isDeleted).toBe(true);
    });

    it("should return not found when deleting an already deleted hunt", async () => {
        // Arrange
        const unique = `hunt-delete-already-${ Date.now() }`;
        const owner = await createUser(`owner-${ unique }`, Role.PLAYER);

        const hunt = await prisma.hunt.create({
            data: {
                title: `Already deleted ${ unique }`,
                description: "Test hunt delete",
                location: "Paris",
                difficulty: Difficulty.EASY,
                startLat: 48.8566,
                startLng: 2.3522,
                createdById: owner.id,
                mode: HuntMode.COMMUNITY,
                status: HuntStatus.DRAFT,
                visibility: HuntVisibility.PUBLIC,
                isDeleted: true,
            },
        });

        // Act + Assert
        await expect(
            deleteHunt({
                huntId: hunt.id,
                currentUserId: owner.id,
                currentUserRole: owner.role,
            }),
        ).rejects.toThrow(HuntNotFoundError);
    });
});