import {
  difficultyLabel,
  huntStatusLabel,
  huntVisibilityLabel,
  label,
} from "@/components/backoffice/labels";

const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  PUBLISHED: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
};

const visibilityStyles: Record<string, string> = {
  PUBLIC: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
  PRIVATE: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/80",
};

const difficultyStyles: Record<string, string> = {
  EASY: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
  MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
  HARD: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/70",
};

export function HuntStatusBadge({ status }: { status: string }) {
  return (
    <span className={`${base} ${statusStyles[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {label(huntStatusLabel, status)}
    </span>
  );
}

export function HuntVisibilityBadge({ visibility }: { visibility: string }) {
  return (
    <span
      className={`${base} ${visibilityStyles[visibility] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {label(huntVisibilityLabel, visibility)}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={`${base} ${difficultyStyles[difficulty] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {label(difficultyLabel, difficulty)}
    </span>
  );
}
