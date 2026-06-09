import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalCurrentUser } from "@/lib/auth/current-user";
import { Roles } from "@/lib/auth/roles";
import BackofficeSidebar from "@/components/backoffice/Sidebar";
import DashboardShell from "@/components/backoffice/DashboardShell";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalCurrentUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/backoffice")}`);
  }

  if (user.role !== Roles.PARTNER && user.role !== Roles.ADMIN) {
    redirect("/");
  }

  const isAdmin = user.role === Roles.ADMIN;

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-zinc-900">
      {/* Sidebar fixe — une seule fois */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <BackofficeSidebar
          username={user.username}
          email={user.email}
          role={user.role}
          isAdmin={isAdmin}
        />
      </aside>

      {/* Zone principale : décalée de la largeur sidebar uniquement */}
      <div className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                L
              </div>
              <div className="text-sm font-semibold">Lootopia</div>
            </div>
            <Link
              href="/backoffice/hunts"
              className="text-sm font-medium text-indigo-600"
            >
              Menu
            </Link>
          </div>
        </header>

        <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="w-full max-w-5xl">
            <DashboardShell username={user.username}>
              {children}
            </DashboardShell>
          </div>
        </main>
      </div>
    </div>
  );
}
