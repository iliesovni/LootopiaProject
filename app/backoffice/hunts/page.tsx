import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import { serverApiClient } from "@/lib/frontend/server-api-client";
import {
  DifficultyBadge,
  HuntStatusBadge,
  HuntVisibilityBadge,
} from "@/components/backoffice/HuntBadges";
import PageHeader from "@/components/backoffice/PageHeader";
import StatCard from "@/components/backoffice/StatCard";
import {
  btnPrimary,
  btnSecondary,
  card,
  cardBody,
  table,
  tableCell,
  tableHead,
  tableHeadCell,
  tableRow,
  tableWrap,
} from "@/components/backoffice/ui";

export default async function BackofficeHuntsPage() {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);
  const hunts = await serverApiClient.listMyHunts();

  const published = hunts.filter((h) => h.status === "PUBLISHED").length;
  const drafts = hunts.filter((h) => h.status === "DRAFT").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chasses"
        description="Vos parcours au trésor"
        action={
          <Link href="/backoffice/hunts/new" className={btnPrimary}>
            + Nouvelle chasse
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={hunts.length} accent="slate" />
        <StatCard label="Publiées" value={published} accent="emerald" />
        <StatCard label="Brouillons" value={drafts} accent="amber" />
      </div>

      <div className={card}>
        {hunts.length === 0 ? (
          <div className={`${cardBody} py-16 text-center`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-700">
              Aucune chasse créée
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Commencez par créer votre premier parcours.
            </p>
            <Link href="/backoffice/hunts/new" className={`${btnPrimary} mt-6`}>
              Créer une chasse
            </Link>
          </div>
        ) : (
          <div className={tableWrap}>
            <table className={table}>
              <thead className={tableHead}>
                <tr>
                  <th className={tableHeadCell}>Chasse</th>
                  <th className={tableHeadCell}>Statut</th>
                  <th className={tableHeadCell}>Accès</th>
                  <th className={tableHeadCell}>Difficulté</th>
                  <th className={`${tableHeadCell} text-center`}>Étapes</th>
                  <th className={`${tableHeadCell} text-right`} />
                </tr>
              </thead>
              <tbody>
                {hunts.map((hunt) => (
                  <tr key={hunt.id} className={tableRow}>
                    <td className={tableCell}>
                      <div className="font-medium text-zinc-900">{hunt.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {hunt.location || "Lieu non défini"}
                      </div>
                    </td>
                    <td className={tableCell}>
                      <HuntStatusBadge status={hunt.status} />
                    </td>
                    <td className={tableCell}>
                      <HuntVisibilityBadge visibility={hunt.visibility} />
                    </td>
                    <td className={tableCell}>
                      <DifficultyBadge difficulty={hunt.difficulty} />
                    </td>
                    <td className={`${tableCell} text-center`}>
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-zinc-100 px-2 text-xs font-semibold text-zinc-700">
                        {hunt.steps?.length ?? 0}
                      </span>
                    </td>
                    <td className={`${tableCell} text-right`}>
                      <Link
                        href={`/backoffice/hunts/${hunt.id}`}
                        className={btnSecondary}
                      >
                        Gérer
                      </Link>
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
