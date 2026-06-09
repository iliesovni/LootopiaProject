import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBackofficeOverview } from "@/lib/backoffice/overview";
import { redirect } from "next/navigation";
import { HuntStatusBadge } from "@/components/backoffice/HuntBadges";
import PageHeader from "@/components/backoffice/PageHeader";
import ParticipationBadge from "@/components/backoffice/ParticipationBadge";
import StatCard from "@/components/backoffice/StatCard";
import {
  btnPrimary,
  btnSecondary,
  card,
  cardBody,
  cardHeader,
} from "@/components/backoffice/ui";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function BackofficeDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/backoffice")}`);
  }

  const overview = await getBackofficeOverview(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vue d'ensemble"
        description="Activité de vos chasses"
        action={
          <Link href="/backoffice/hunts/new" className={btnPrimary}>
            + Nouvelle chasse
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Chasses" value={overview.stats.totalHunts} accent="slate" />
        <StatCard label="Publiées" value={overview.stats.published} accent="emerald" />
        <StatCard
          label="Participations"
          value={overview.stats.totalParticipations}
          accent="sky"
        />
        <StatCard
          label="Joueurs uniques"
          value={overview.stats.uniquePlayers}
          accent="amber"
        />
      </div>

      {overview.readyToPublish.length > 0 ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-5 py-4">
          <p className="text-sm font-medium text-amber-900">
            {overview.readyToPublish.length} chasse
            {overview.readyToPublish.length !== 1 ? "s" : ""} prête
            {overview.readyToPublish.length !== 1 ? "s" : ""} à publier
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {overview.readyToPublish.map((hunt) => (
              <Link
                key={hunt.id}
                href={`/backoffice/hunts/${hunt.id}`}
                className={btnSecondary}
              >
                {hunt.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <div className={cardHeader}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900">Chasses récentes</span>
              <Link href="/backoffice/hunts" className="text-xs font-medium text-indigo-600">
                Tout voir
              </Link>
            </div>
          </div>
          {overview.recentHunts.length === 0 ? (
            <div className={`${cardBody} text-sm text-zinc-500`}>Aucune chasse.</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {overview.recentHunts.map((hunt) => (
                <li key={hunt.id}>
                  <Link
                    href={`/backoffice/hunts/${hunt.id}`}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-indigo-50/30"
                  >
                    <div>
                      <div className="font-medium text-zinc-900">{hunt.title}</div>
                      <div className="text-xs text-zinc-500">
                        {hunt._count.steps} étape{hunt._count.steps !== 1 ? "s" : ""} ·{" "}
                        {hunt._count.participations} joueur
                        {hunt._count.participations !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <HuntStatusBadge status={hunt.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={card}>
          <div className={cardHeader}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900">
                Dernières participations
              </span>
              <Link
                href="/backoffice/participations"
                className="text-xs font-medium text-indigo-600"
              >
                Tout voir
              </Link>
            </div>
          </div>
          {overview.recentParticipations.length === 0 ? (
            <div className={`${cardBody} text-sm text-zinc-500`}>
              Aucun joueur pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {overview.recentParticipations.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900">
                      {p.user.username}
                    </div>
                    <div className="truncate text-xs text-zinc-500">{p.hunt.title}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <ParticipationBadge status={p.status} />
                    <div className="mt-1 text-xs text-zinc-400">
                      {formatDate(p.startedAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/backoffice/map"
          className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
        >
          <div className="text-sm font-medium text-zinc-900">Carte</div>
          <div className="mt-1 text-xs text-zinc-500">Visualiser vos parcours</div>
        </Link>
        <Link
          href="/discover"
          target="_blank"
          className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
        >
          <div className="text-sm font-medium text-zinc-900">Catalogue public ↗</div>
          <div className="mt-1 text-xs text-zinc-500">Voir ce que les joueurs voient</div>
        </Link>
        <Link
          href="/backoffice/hunts"
          className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
        >
          <div className="text-sm font-medium text-zinc-900">Gérer les chasses</div>
          <div className="mt-1 text-xs text-zinc-500">Créer, modifier, publier</div>
        </Link>
      </div>
    </div>
  );
}
