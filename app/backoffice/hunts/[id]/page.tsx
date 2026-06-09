import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import {
  HuntStatusBadge,
  HuntVisibilityBadge,
} from "@/components/backoffice/HuntBadges";
import { difficultyLabel, label } from "@/components/backoffice/labels";
import PageHeader from "@/components/backoffice/PageHeader";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  card,
  cardBody,
  input,
  select,
} from "@/components/backoffice/ui";
import { serverApiClient } from "@/lib/frontend/server-api-client";
import {
  deleteHuntAction,
  publishHuntAction,
  updateHuntAction,
} from "../actions";

type HuntOwnerStep = {
  id: string;
  title: string;
  orderIndex: number;
  _count?: { clues: number };
  clues?: unknown[];
};

type HuntOwnerView = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  difficulty: string;
  startLat: number;
  startLng: number;
  status: "DRAFT" | "PUBLISHED";
  visibility: "PUBLIC" | "PRIVATE";
  accessCode: string | null;
  steps: HuntOwnerStep[];
};

function isOwnerHunt(hunt: unknown): hunt is HuntOwnerView {
  const record = hunt as Record<string, unknown>;
  return (
    typeof record.title === "string" &&
    typeof record.status === "string" &&
    Array.isArray(record.steps)
  );
}

function clueCount(step: HuntOwnerStep) {
  return step._count?.clues ?? step.clues?.length ?? 0;
}

export default async function HuntDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  const hunt = await serverApiClient.getHuntDetail(id);
  const isOwnerView = isOwnerHunt(hunt);
  const ownerHunt = isOwnerView ? hunt : null;

  const sortedSteps = ownerHunt
    ? [...ownerHunt.steps].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={hunt.title}
        description={
          isOwnerView
            ? `${ownerHunt!.location} · ${label(difficultyLabel, ownerHunt!.difficulty)}`
            : "Chasse"
        }
        backHref="/backoffice/hunts"
        backLabel="Chasses"
        action={
          isOwnerView ? (
            <div className="flex flex-wrap items-center gap-2">
              <HuntStatusBadge status={ownerHunt!.status} />
              <HuntVisibilityBadge visibility={ownerHunt!.visibility} />
              <form
                action={async () => {
                  "use server";
                  await publishHuntAction(id);
                }}
              >
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={ownerHunt!.status === "PUBLISHED"}
                >
                  Publier
                </button>
              </form>
            </div>
          ) : undefined
        }
      />

      {sp.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sp.error}
        </div>
      ) : null}

      {!isOwnerView ? (
        <div className={`${card} ${cardBody}`}>
          <h2 className="text-sm font-semibold text-zinc-900">Accès limité</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Vous devez être le créateur de cette chasse pour la modifier.
          </p>
          <Link href="/backoffice/hunts" className={`${btnSecondary} mt-4`}>
            Retour aux chasses
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className={card}>
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Informations générales
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Modifiable tant que la chasse est en brouillon.
                </p>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  await updateHuntAction(id, formData);
                }}
                className={`${cardBody} grid gap-4 sm:grid-cols-2`}
              >
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-medium text-zinc-500">Titre</span>
                  <input
                    name="title"
                    defaultValue={hunt.title ?? ""}
                    className={input}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Localisation
                  </span>
                  <input
                    name="location"
                    defaultValue={hunt.location ?? ""}
                    className={input}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Difficulté
                  </span>
                  <select
                    name="difficulty"
                    defaultValue={hunt.difficulty ?? undefined}
                    className={select}
                  >
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                  </select>
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-medium text-zinc-500">
                    Description
                  </span>
                  <textarea
                    name="description"
                    defaultValue={hunt.description ?? ""}
                    className={`${input} min-h-24`}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Visibilité
                  </span>
                  <select
                    name="visibility"
                    defaultValue={ownerHunt?.visibility ?? undefined}
                    className={select}
                  >
                    <option value="PUBLIC">Publique</option>
                    <option value="PRIVATE">Privée</option>
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Code d&apos;accès (privée)
                  </span>
                  <input
                    name="accessCode"
                    defaultValue={ownerHunt?.accessCode ?? ""}
                    placeholder="8 chiffres"
                    className={input}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Latitude de départ
                  </span>
                  <input
                    name="startLat"
                    type="number"
                    step="any"
                    defaultValue={ownerHunt?.startLat ?? undefined}
                    className={input}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Longitude de départ
                  </span>
                  <input
                    name="startLng"
                    type="number"
                    step="any"
                    defaultValue={ownerHunt?.startLng ?? undefined}
                    className={input}
                  />
                </label>

                <div className="sm:col-span-2 pt-1">
                  <button type="submit" className={btnPrimary}>
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </section>

          <aside className="space-y-6">
            <div className={card}>
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Étapes</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Minimum 2 étapes pour publier.
                </p>
              </div>

              <div className={cardBody}>
                {sortedSteps.length === 0 ? (
                  <p className="text-sm text-zinc-500">Aucune étape.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
                    {sortedSteps.map((step) => (
                      <li key={step.id}>
                        <Link
                          href={`/backoffice/hunts/${id}/steps/${step.id}`}
                          className="flex items-center justify-between gap-3 px-3 py-3 text-sm transition-colors hover:bg-zinc-50"
                        >
                          <span className="font-medium text-zinc-900">
                            {step.orderIndex}. {step.title}
                          </span>
                          <span className="shrink-0 text-xs text-zinc-500">
                            {clueCount(step)} indice{clueCount(step) !== 1 ? "s" : ""}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href={`/backoffice/hunts/${id}/steps/new`}
                  className={`${btnSecondary} mt-4 w-full text-center`}
                >
                  Ajouter une étape
                </Link>
              </div>
            </div>

            <div className={card}>
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Zone de danger
                </h2>
              </div>
              <div className={cardBody}>
                <p className="text-sm text-zinc-500">
                  Cette action est irréversible pour les joueurs.
                </p>
                <form
                  action={async () => {
                    "use server";
                    await deleteHuntAction(id);
                  }}
                  className="mt-4"
                >
                  <button type="submit" className={`${btnDanger} w-full`}>
                    Supprimer la chasse
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
