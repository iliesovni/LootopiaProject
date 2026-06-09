import { Roles } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import RoleBadge from "@/components/backoffice/RoleBadge";
import {
  btnPrimary,
  btnSecondary,
  card,
  cardHeader,
  input,
  select,
  table,
  tableCell,
  tableHead,
  tableHeadCell,
  tableRow,
  tableWrap,
} from "@/components/backoffice/ui";

type UsersPageSearchParams = {
  q?: string;
  role?: "PLAYER" | "PARTNER" | "ADMIN" | "ALL";
  partner?: "yes" | "no" | "all";
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function BackofficeUsersPage({
  searchParams,
}: {
  searchParams?: Promise<UsersPageSearchParams>;
}) {
  const user = await getCurrentUser();

  if (user.role !== Roles.ADMIN) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Accès refusé"
          description="Cette section est réservée aux administrateurs."
        />
        <Link href="/backoffice/hunts" className={btnSecondary}>
          Retour aux chasses
        </Link>
      </div>
    );
  }

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const roleFilter = sp.role ?? "ALL";
  const partnerFilter = sp.partner ?? "all";

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(roleFilter !== "ALL" ? { role: roleFilter } : {}),
      ...(partnerFilter === "yes"
        ? { partner: { isNot: null } }
        : partnerFilter === "no"
          ? { partner: { is: null } }
          : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      partner: {
        select: { companyName: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes"
        description="Utilisateurs et accès"
      />

      <div className={card}>
        <div className={cardHeader}>
          <form method="GET" className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-end">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-500">Recherche</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Nom ou email…"
                className={input}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-500">Rôle</span>
              <select name="role" defaultValue={roleFilter} className={`${select} lg:w-36`}>
                <option value="ALL">Tous</option>
                <option value={Roles.PLAYER}>Joueur</option>
                <option value={Roles.PARTNER}>Partenaire</option>
                <option value={Roles.ADMIN}>Admin</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-500">Partenaire</span>
              <select
                name="partner"
                defaultValue={partnerFilter}
                className={`${select} lg:w-36`}
              >
                <option value="all">Tous</option>
                <option value="yes">Avec profil</option>
                <option value="no">Sans profil</option>
              </select>
            </label>

            <button type="submit" className={btnPrimary}>
              Appliquer
            </button>
            <Link href="/backoffice/users" className={`${btnSecondary} text-center`}>
              Réinitialiser
            </Link>
          </form>
        </div>

        <div className={tableWrap}>
          <table className={table}>
            <thead className={tableHead}>
              <tr>
                <th className={tableHeadCell}>Utilisateur</th>
                <th className={tableHeadCell}>Rôle</th>
                <th className={tableHeadCell}>Organisation</th>
                <th className={tableHeadCell}>Inscription</th>
                <th className={`${tableHeadCell} text-right`} />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`${tableCell} py-12 text-center text-zinc-500`}>
                    Aucun résultat
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className={tableRow}>
                    <td className={tableCell}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                          {u.username.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900">{u.username}</div>
                          <div className="truncate text-xs text-zinc-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={tableCell}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td className={`${tableCell} text-zinc-600`}>
                      {u.partner?.companyName ?? (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className={`${tableCell} whitespace-nowrap text-zinc-500`}>
                      {formatDate(u.createdAt)}
                    </td>
                    <td className={`${tableCell} text-right`}>
                      <Link
                        href={`/backoffice/users/${u.id}`}
                        className={btnSecondary}
                      >
                        Gérer
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500">
          {users.length} compte{users.length !== 1 ? "s" : ""}
          {q ? ` · « ${q} »` : ""}
        </div>
      </div>
    </div>
  );
}
