import { Roles } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import RoleBadge, { roleLabel } from "@/components/backoffice/RoleBadge";
import {
  btnPrimary,
  btnSecondary,
  card,
  cardBody,
  input,
  select,
} from "@/components/backoffice/ui";
import {
  resetUserPasswordAction,
  updateUserRoleAction,
  upsertPartnerProfileAction,
} from "../server-actions";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function BackofficeUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser.role !== Roles.ADMIN) {
    redirect("/backoffice/hunts");
  }

  const { userId } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      partner: {
        select: { id: true, companyName: true },
      },
    },
  });

  if (!targetUser) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={targetUser.username}
        description={targetUser.email}
        backHref="/backoffice/users"
        backLabel="Comptes"
      />

      <div className={`${card} ${cardBody}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700">
            {targetUser.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-zinc-900">
                {targetUser.username}
              </span>
              <RoleBadge role={targetUser.role} />
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              Inscrit le {formatDate(targetUser.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <section className={card}>
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Rôle</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Définit les permissions de l&apos;utilisateur sur la plateforme.
          </p>
        </div>
        <form
          action={updateUserRoleAction.bind(null, targetUser.id)}
          className={`${cardBody} flex flex-wrap items-end gap-3`}
        >
          <label className="min-w-[200px] flex-1 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Rôle actuel</span>
            <select name="role" defaultValue={targetUser.role} className={select}>
              <option value={Roles.PLAYER}>Joueur</option>
              <option value={Roles.PARTNER}>Partenaire</option>
              <option value={Roles.ADMIN}>Admin</option>
            </select>
          </label>
          <button type="submit" className={btnPrimary}>
            Enregistrer le rôle
          </button>
        </form>
      </section>

      <section className={card}>
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Profil partenaire</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Associe une organisation. L&apos;utilisateur passera automatiquement en
            rôle {roleLabel(Roles.PARTNER).toLowerCase()}.
          </p>
        </div>
        <form
          action={upsertPartnerProfileAction.bind(null, targetUser.id)}
          className={`${cardBody} flex flex-wrap items-end gap-3`}
        >
          <label className="min-w-[240px] flex-1 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">
              Nom de l&apos;organisation
            </span>
            <input
              name="companyName"
              defaultValue={targetUser.partner?.companyName ?? ""}
              placeholder="Ex. Musée des Arts"
              className={input}
            />
          </label>
          <button type="submit" className={btnSecondary}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className={card}>
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Sécurité</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Réinitialise le mot de passe de l&apos;utilisateur (8 caractères minimum).
          </p>
        </div>
        <form
          action={resetUserPasswordAction.bind(null, targetUser.id)}
          className={`${cardBody} flex flex-wrap items-end gap-3`}
        >
          <label className="min-w-[240px] flex-1 space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">
              Nouveau mot de passe
            </span>
            <input
              name="password"
              type="password"
              minLength={8}
              placeholder="••••••••"
              className={input}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className={btnSecondary}>
            Réinitialiser
          </button>
        </form>
      </section>
    </div>
  );
}
