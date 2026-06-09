import Link from "next/link";
import { createStepAction } from "../actions";
import { ARMarkerType } from "@prisma/client";

export default async function NewStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: huntId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ajouter une étape</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Définis une zone (lat/lng + rayon) et une récompense.
          </p>
        </div>
        <Link
          href={`/backoffice/hunts/${huntId}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Retour
        </Link>
      </div>

      <form
        action={async (formData) => {
          "use server";
          await createStepAction(huntId, formData);
        }}
        className="space-y-6"
      >
        <div className="grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-medium">Titre</div>
            <input
              name="title"
              required
              minLength={3}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-medium">Description</div>
            <textarea
              name="description"
              required
              className="min-h-24 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Latitude</div>
            <input
              name="latitude"
              type="number"
              step="any"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Longitude</div>
            <input
              name="longitude"
              type="number"
              step="any"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Rayon (mètres)</div>
            <input
              name="radiusMeters"
              type="number"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              defaultValue={50}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Ordre (0..n)</div>
            <input
              name="orderIndex"
              type="number"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              defaultValue={0}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Points reward</div>
            <input
              name="pointsReward"
              type="number"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              defaultValue={100}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">AR marker type (optionnel)</div>
            <select
              name="arMarkerType"
              defaultValue=""
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Aucun</option>
              <option value={ARMarkerType.IMAGE}>IMAGE</option>
              <option value={ARMarkerType.PATTERN}>PATTERN</option>
              <option value={ARMarkerType.MODEL_3D}>MODEL_3D</option>
            </select>
          </label>

          <label className="space-y-1 sm:col-span-2">
            <div className="text-sm font-medium">AR asset url (optionnel)</div>
            <input
              name="arAssetUrl"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Ajouter
          </button>
          <Link
            href={`/backoffice/hunts/${huntId}`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}

