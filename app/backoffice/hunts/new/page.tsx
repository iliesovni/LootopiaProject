import Link from "next/link";
import { createHuntAction } from "../actions";
import { Difficulty, HuntVisibility } from "@prisma/client";

export default async function NewHuntPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Créer une chasse
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Définis les infos de base. Tu pourras ensuite ajouter des étapes,
            des indices et publier.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/backoffice/hunts"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            Retour
          </Link>
        </div>
      </div>

      {sp.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {sp.error}
        </div>
      ) : null}

      <form action={createHuntAction} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Informations</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Ces champs seront visibles dans les listes et la carte.
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                DRAFT par défaut
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-semibold">Titre</div>
                <input
                  name="title"
                  required
                  minLength={3}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="Ex: Les secrets du musée"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Localisation</div>
                <input
                  name="location"
                  required
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="Ex: Paris"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-semibold">Difficulté</div>
                <select
                  name="difficulty"
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                  defaultValue={Difficulty.EASY}
                >
                  <option value={Difficulty.EASY}>EASY</option>
                  <option value={Difficulty.MEDIUM}>MEDIUM</option>
                  <option value={Difficulty.HARD}>HARD</option>
                </select>
              </label>

              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-semibold">Description</div>
                <textarea
                  name="description"
                  className="min-h-24 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="Optionnel"
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold">Accès</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Choisis la visibilité et un éventuel code.
              </p>

              <div className="mt-5 grid gap-4">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Visibilité</div>
                  <select
                    name="visibility"
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                    defaultValue={HuntVisibility.PUBLIC}
                  >
                    <option value={HuntVisibility.PUBLIC}>PUBLIC</option>
                    <option value={HuntVisibility.PRIVATE}>PRIVATE</option>
                  </select>
                  <div className="text-xs text-zinc-500">
                    PRIVATE → nécessite un code à 8 chiffres.
                  </div>
                </label>

                <label className="space-y-1">
                  <div className="text-sm font-semibold">
                    Code d’accès (8 chiffres)
                  </div>
                  <input
                    name="accessCode"
                    inputMode="numeric"
                    pattern="\\d{8}"
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                    placeholder="Ex: 12345678"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold">Point de départ</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Utilisé pour centrer la carte sur la chasse.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Latitude</div>
                  <input
                    name="startLat"
                    type="number"
                    step="any"
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                    placeholder="48.8566"
                  />
                </label>
                <label className="space-y-1">
                  <div className="text-sm font-semibold">Longitude</div>
                  <input
                    name="startLng"
                    type="number"
                    step="any"
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none ring-zinc-200 focus:ring-2 focus:ring-zinc-900/10"
                    placeholder="2.3522"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Créer la chasse
          </button>
          <Link
            href="/backoffice/hunts"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

