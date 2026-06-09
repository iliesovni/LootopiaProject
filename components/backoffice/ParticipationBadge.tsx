const labels: Record<string, string> = {
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  ABANDONED: "Abandonnée",
};

const styles: Record<string, string> = {
  IN_PROGRESS: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  ABANDONED: "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80",
};

export default function ParticipationBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.ABANDONED}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
