type StatCardProps = {
  label: string;
  value: number;
  accent: "slate" | "emerald" | "amber" | "sky";
};

const accents = {
  slate: "border-l-slate-500 bg-slate-50/50",
  emerald: "border-l-emerald-500 bg-emerald-50/40",
  amber: "border-l-amber-500 bg-amber-50/40",
  sky: "border-l-sky-500 bg-sky-50/40",
};

export default function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200/80 border-l-4 bg-white p-5 shadow-sm ${accents[accent]}`}
    >
      <div className="text-sm font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900">
        {value}
      </div>
    </div>
  );
}
