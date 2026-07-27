import { ReactNode } from "react";

export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function ProgressRing({
  value,
  max,
  label,
  sublabel,
  size = 92,
}: {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const pct = Math.min(1, max ? value / max : 0);
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#334155" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#4f46e5"
          strokeWidth={8}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-100">{label}</span>
        {sublabel && <span className="text-[10px] text-slate-400">{sublabel}</span>}
      </div>
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-900/60 px-3 py-2 text-center">
      <div className="text-lg font-bold text-slate-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, max ? (value / max) * 100 : 0);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
