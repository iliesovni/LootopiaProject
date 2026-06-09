import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import { getHuntParticipations } from "@/lib/backoffice/overview";
import { getCurrentUser } from "@/lib/auth/current-user";
import PageHeader from "@/components/backoffice/PageHeader";
import ParticipationBadge from "@/components/backoffice/ParticipationBadge";
import StatCard from "@/components/backoffice/StatCard";
import {
  card,
  table,
  tableCell,
  tableHead,
  tableHeadCell,
  tableRow,
  tableWrap,
} from "@/components/backoffice/ui";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function BackofficeParticipationsPage() {
  const user = await getCurrentUser();
  await requireRole([Roles.PARTNER, Roles.ADMIN]);

  const participations = await getHuntParticipations(user.id);

  const inProgress = participations.filter((p) => p.status === "IN_PROGRESS").length;
  const completed = participations.filter((p) => p.status === "COMPLETED").length;
  const abandoned = participations.filter((p) => p.status === "ABANDONED").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Participations"
        description="Joueurs ayant lancé vos chasses"
        backHref="/backoffice"
        backLabel="Vue d'ensemble"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="En cours" value={inProgress} accent="sky" />
        <StatCard label="Terminées" value={completed} accent="emerald" />
        <StatCard label="Abandonnées" value={abandoned} accent="slate" />
      </div>

      <div className={card}>
        {participations.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-500">
            Aucune participation pour l&apos;instant. Publiez une chasse pour attirer des
            joueurs.
          </div>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead className={tableHead}>
                <tr>
                  <th className={tableHeadCell}>Joueur</th>
                  <th className={tableHeadCell}>Chasse</th>
                  <th className={tableHeadCell}>Statut</th>
                  <th className={tableHeadCell}>Score</th>
                  <th className={tableHeadCell}>Début</th>
                </tr>
              </thead>
              <tbody>
                {participations.map((p) => (
                  <tr key={p.id} className={tableRow}>
                    <td className={tableCell}>
                      <div className="font-medium text-zinc-900">{p.user.username}</div>
                      <div className="text-xs text-zinc-500">{p.user.email}</div>
                    </td>
                    <td className={tableCell}>
                      <Link
                        href={`/backoffice/hunts/${p.hunt.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        {p.hunt.title}
                      </Link>
                      <div className="text-xs text-zinc-500">{p.hunt.location}</div>
                    </td>
                    <td className={tableCell}>
                      <ParticipationBadge status={p.status} />
                    </td>
                    <td className={`${tableCell} tabular-nums font-medium text-zinc-800`}>
                      {p.totalScore} pts
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-zinc-500`}>
                      {formatDate(p.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
