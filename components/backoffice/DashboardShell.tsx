"use client";

import { usePathname } from "next/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  username: string;
};

function showWelcomeBanner(pathname: string) {
  return (
    pathname === "/backoffice" ||
    pathname === "/backoffice/hunts" ||
    pathname === "/backoffice/participations" ||
    pathname === "/backoffice/map" ||
    pathname === "/backoffice/users"
  );
}

export default function DashboardShell({
  children,
  username,
}: DashboardShellProps) {
  const pathname = usePathname();
  const welcome = showWelcomeBanner(pathname);

  return (
    <div className="flex w-full flex-1 flex-col">
      {welcome ? (
        <div className="mb-8 w-full rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-sm">
          <p className="text-sm font-medium text-indigo-100">Tableau de bord</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            Bonjour, {username}
          </p>
        </div>
      ) : null}
      <div className="w-full">{children}</div>
    </div>
  );
}
