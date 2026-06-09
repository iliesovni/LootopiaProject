import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { Roles } from "@/lib/auth/roles";
import { serverApiClient } from "@/lib/frontend/server-api-client";
import {
  createClueAction,
  deleteClueAction,
  deleteStepAction,
  updateStepAction,
} from "../actions";

export default async function StepDetailPage({
  params,
}: {
  params: Promise<{ id: string; stepId: string }>;
}) {
  await requireRole([Roles.PARTNER, Roles.ADMIN]);
  const { id: huntId, stepId } = await params;

  const step = await serverApiClient.getStep(stepId);
  const clues = await serverApiClient.listStepClues(stepId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Étape {step.orderIndex}: {step.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Modifiable uniquement si la chasse est en DRAFT.
          </p>
        </div>
        <Link
          href={`/backoffice/hunts/${huntId}`}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
        >
          Retour à la chasse
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold">Paramètres de l’étape</h2>

            <form
              action={async (formData) => {
                "use server";
                await updateStepAction(huntId, stepId, formData);
              }}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-semibold">Titre</div>
                <input
                  name="title"
                  defaultValue={step.title ?? ""}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-semibold">Description</div>
                <textarea
                  name="description"
                  defaultValue={step.description ?? ""}
                  className="min-h-24 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Latitude</div>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={step.latitude ?? undefined}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Longitude</div>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={step.longitude ?? undefined}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Rayon (m)</div>
                <input
                  name="radiusMeters"
                  type="number"
                  defaultValue={step.radiusMeters ?? undefined}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Ordre</div>
                <input
                  name="orderIndex"
                  type="number"
                  defaultValue={step.orderIndex ?? undefined}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Points reward</div>
                <input
                  name="pointsReward"
                  type="number"
                  defaultValue={step.pointsReward ?? undefined}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>

              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold">Indices (max 3)</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Ajouter un indice augmente la difficulté (pénalité de points).
            </p>

            <div className="mt-4 space-y-3">
              {clues.length === 0 ? (
                <div className="text-sm text-zinc-600">Aucun indice.</div>
              ) : (
                clues.map((clue: (typeof clues)[number]) => (
                  <div
                    key={clue.id}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          #{clue.orderIndex} • pénalité {clue.penaltyPoints}
                        </div>
                        <div className="mt-1 text-sm text-zinc-700 break-words">
                          {clue.content}
                        </div>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await deleteClueAction(huntId, stepId, clue.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 rounded-2xl border bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold">Ajouter un indice</h3>
              <form
                action={async (formData) => {
                  "use server";
                  await createClueAction(huntId, stepId, formData);
                }}
                className="mt-3 grid gap-3 sm:grid-cols-3"
              >
                <label className="space-y-1 sm:col-span-3">
                  <div className="text-sm font-semibold">Contenu</div>
                  <textarea
                    name="content"
                    required
                    className="min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Pénalité</div>
                  <input
                    name="penaltyPoints"
                    type="number"
                    defaultValue={10}
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">Ordre (optionnel)</div>
                  <input
                    name="orderIndex"
                    type="number"
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                    placeholder="auto"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-red-200 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-red-700">Zone danger</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Supprime l’étape et réindexe les suivantes.
            </p>
            <form
              action={async () => {
                "use server";
                await deleteStepAction(huntId, stepId);
              }}
              className="mt-4"
            >
              <button
                type="submit"
                className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                Supprimer l’étape
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

