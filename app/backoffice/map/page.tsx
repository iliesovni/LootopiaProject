import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import HuntMapExplorer from "@/components/backoffice/HuntMapExplorer";
import PageHeader from "@/components/backoffice/PageHeader";
import { serverApiClient } from "@/lib/frontend/server-api-client";

export default async function BackofficeMapPage() {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const hunts = await serverApiClient.listMyHunts();

  const huntsForMap = hunts.map((hunt) => ({
    id: hunt.id,
    title: hunt.title,
    location: hunt.location,
    startLat: hunt.startLat,
    startLng: hunt.startLng,
    status: hunt.status,
    steps: (hunt.steps ?? []).map((step) => ({
      id: step.id,
      title: step.title,
      latitude: step.latitude,
      longitude: step.longitude,
      radiusMeters: step.radiusMeters,
      orderIndex: step.orderIndex,
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carte"
        description="Parcours et étapes géolocalisées"
        backHref="/backoffice"
        backLabel="Vue d'ensemble"
      />
      <HuntMapExplorer hunts={huntsForMap} />
    </div>
  );
}
