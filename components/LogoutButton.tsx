"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={
        className ??
        "w-full rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/15 disabled:opacity-60"
      }
    >
      {loading ? "Déconnexion..." : "Déconnexion"}
    </button>
  );
}

