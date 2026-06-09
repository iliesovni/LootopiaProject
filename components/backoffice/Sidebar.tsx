"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { roleLabel } from "@/components/backoffice/RoleBadge";

type SidebarProps = {
  username: string;
  email: string;
  role: string;
  isAdmin: boolean;
};

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
  adminOnly?: boolean;
  match: (pathname: string) => boolean;
};

const mainNav: NavItem[] = [
  {
    href: "/backoffice",
    label: "Vue d'ensemble",
    match: (p) => p === "/backoffice",
  },
  {
    href: "/backoffice/hunts",
    label: "Chasses",
    match: (p) => p === "/backoffice/hunts" || p.startsWith("/backoffice/hunts/"),
  },
  {
    href: "/backoffice/participations",
    label: "Participations",
    match: (p) => p.startsWith("/backoffice/participations"),
  },
  {
    href: "/backoffice/map",
    label: "Carte",
    match: (p) => p.startsWith("/backoffice/map"),
  },
];

const secondaryNav: NavItem[] = [
  {
    href: "/backoffice/users",
    label: "Comptes",
    adminOnly: true,
    match: (p) => p.startsWith("/backoffice/users"),
  },
  {
    href: "/discover",
    label: "Catalogue public",
    external: true,
    match: () => false,
  },
];

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-indigo-50 text-indigo-700"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
  ].join(" ");
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={navLinkClass(false)}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />
        {item.label}
        <span className="ml-auto text-xs text-zinc-400">↗</span>
      </a>
    );
  }

  return (
    <Link href={item.href} className={navLinkClass(active)}>
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-indigo-500" : "bg-transparent"}`}
      />
      {item.label}
    </Link>
  );
}

export default function BackofficeSidebar({
  username,
  email,
  role,
  isAdmin,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-zinc-200/80 bg-white">
      <div className="border-b border-zinc-100 px-5 py-6">
        <Link href="/backoffice" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
            L
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">Lootopia</div>
            <div className="text-xs text-zinc-500">Espace partenaire</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 px-3 py-5">
        <div className="space-y-0.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Gestion
          </div>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="space-y-0.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Plus
          </div>
          {secondaryNav
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
        </div>
      </nav>

      <div className="border-t border-zinc-100 p-4">
        <div className="rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-zinc-900">
                {username}
              </div>
              <div className="truncate text-xs text-zinc-500">{email}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Rôle</span>
            <span className="rounded-full bg-white px-2 py-0.5 font-medium text-indigo-700 ring-1 ring-indigo-100">
              {roleLabel(role)}
            </span>
          </div>
          <div className="mt-3">
            <LogoutButton className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-60" />
          </div>
        </div>
      </div>
    </aside>
  );
}
