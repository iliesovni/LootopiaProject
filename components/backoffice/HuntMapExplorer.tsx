"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LatLngTuple } from "leaflet";
import Map from "@/components/Map";
import { btnPrimary, btnSecondary, card, cardBody } from "@/components/backoffice/ui";

type HuntStep = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  orderIndex: number;
};

type HuntForMap = {
  id: string;
  title: string;
  location: string;
  startLat: number;
  startLng: number;
  status: string;
  steps: HuntStep[];
};

export default function HuntMapExplorer({ hunts }: { hunts: HuntForMap[] }) {
  const [selectedId, setSelectedId] = useState(hunts[0]?.id ?? "");

  const selected = useMemo(
    () => hunts.find((h) => h.id === selectedId) ?? hunts[0] ?? null,
    [hunts, selectedId],
  );

  if (!hunts.length) {
    return (
      <div className={`${card} ${cardBody} text-center py-12`}>
        <p className="text-sm text-zinc-500">Créez une chasse pour la visualiser sur la carte.</p>
        <Link href="/backoffice/hunts/new" className={`${btnPrimary} mt-4`}>
          Nouvelle chasse
        </Link>
      </div>
    );
  }

  const center: LatLngTuple = selected
    ? [selected.startLat, selected.startLng]
    : [48.8566, 2.3522];

  const destinations = (selected?.steps ?? []).map((step) => ({
    id: step.id,
    position: [step.latitude, step.longitude] as LatLngTuple,
    radius: step.radiusMeters,
    label: `${step.orderIndex}. ${step.title}`,
    description: `Rayon ${step.radiusMeters} m`,
  }));

  return (
    <div className="space-y-4">
      <div className={`${card} ${cardBody}`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">Chasse à afficher</span>
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {hunts.map((hunt) => (
              <option key={hunt.id} value={hunt.id}>
                {hunt.title} — {hunt.location}
              </option>
            ))}
          </select>
        </label>

        {selected ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/backoffice/hunts/${selected.id}`} className={btnSecondary}>
              Gérer la chasse
            </Link>
            <Link
              href={`/backoffice/hunts/${selected.id}/steps/new`}
              className={btnPrimary}
            >
              Ajouter une étape
            </Link>
            {selected.status === "PUBLISHED" && (
              <Link
                href={`/discover/${selected.id}`}
                target="_blank"
                className={btnSecondary}
              >
                Aperçu joueur ↗
              </Link>
            )}
          </div>
        ) : null}
      </div>

      <div className={`${card} overflow-hidden`}>
        <Map
          center={center}
          zoom={14}
          height="480px"
          markerPosition={center}
          destinations={destinations}
        />
      </div>

      {selected && selected.steps.length > 0 ? (
        <div className={`${card} ${cardBody}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {selected.steps.length} étape{selected.steps.length !== 1 ? "s" : ""} sur la carte
          </p>
          <ul className="mt-3 space-y-2">
            {selected.steps
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((step) => (
                <li
                  key={step.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-zinc-800">
                    {step.orderIndex}. {step.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {step.latitude.toFixed(4)}, {step.longitude.toFixed(4)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
