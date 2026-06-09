"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BackofficeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BACKOFFICE_ERROR]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-xl font-semibold">Impossible d’ouvrir le backoffice</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {error.message || "Erreur inconnue."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Retour accueil
          </Link>
          <Link
            href="/api/auth/me"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            Vérifier session
          </Link>
        </div>
      </div>
    </div>
  );
}

