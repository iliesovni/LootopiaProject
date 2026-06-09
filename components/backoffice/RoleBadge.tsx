const roleLabels: Record<string, string> = {
  PLAYER: "Joueur",
  PARTNER: "Partenaire",
  ADMIN: "Admin",
};

export { roleLabels as roleLabelMap };

export function roleLabel(role: string) {
  return roleLabels[role] ?? role;
}

const styles: Record<string, string> = {
  ADMIN: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/80",
  PARTNER: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80",
  PLAYER: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80",
};

export default function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role] ?? styles.PLAYER}`}
    >
      {roleLabel(role)}
    </span>
  );
}
