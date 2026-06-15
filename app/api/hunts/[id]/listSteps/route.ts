import { apiError, apiSuccess } from "@/lib/api/responses";
import { prisma } from "@/lib/db/prisma";
import { mapHuntError } from "@/lib/services/hunt.service";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const listSteps = await prisma.step.findMany({ where: { huntId: id } });

    return apiSuccess("Steps trouvée.", listSteps);
  } catch (error) {
    console.error("[HUNT_ERROR]", error);

    const mapped = mapHuntError(error);
    if (mapped) return mapped;

    return apiError(
      "Erreur lors de la récupération de la chasse.",
      "INTERNAL_SERVER_ERROR",
      500,
    );
  }
}
