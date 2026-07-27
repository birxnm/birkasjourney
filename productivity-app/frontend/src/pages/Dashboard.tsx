import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { focusStatus } from "../lib/focus";
import { Bar, ProgressRing, Section, StatPill } from "../components/ui";

const skillEmoji: Record<string, string> = {
  writing: "✍️",
  speaking: "🗣️",
  reading: "📖",
  listening: "🎧",
};

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const focus = focusStatus();

  const load = () => api.dashboard().then(setData);
  useEffect(() => {
    load();
  }, []);

  const toggleTask = async (id: number) => {
    await api.toggleTask(id);
    load();
  };
  const addWater = async (ml: number) => {
    await api.addWater(ml);
    load();
  };

  if (!data) return <div className="text-slate-400">Loading…</div>;

  const w = data.water;

  return (
    <div>
      <header className="mb-5">
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold">Good to see you, let's go 👋</h1>
      </header>

      {/* Focus banner */}
      <div
        className={`mb-5 rounded-2xl p-4 ${
          focus.mode === "deep"
            ? "bg-gradient-to-br from-indigo-600 to-violet-700"
            : "bg-gradient-to-br from-pink-600 to-rose-600"
        }`}
      >
        <div className="text-2xl">{focus.emoji}</div>
        <div className="text-lg font-bold">{focus.title}</div>
        <div className="text-sm text-white/80">{focus.subtitle}</div>
      </div>

      {/* Countdown */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-brand/40 bg-brand/10 p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-brand-light">
            IELTS exam · {data.exam_date}
          </div>
          <div className="text-sm text-slate-300">Target: overall 8.5</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-brand-light">{data.days_to_exam}</div>
          <div className="text-[10px] uppercase text-slate-400">days left</div>
        </div>
      </div>

      {/* IELTS tasks today */}
      <Section
        title="Today's IELTS focus"
        right={
          <span className="text-xs text-slate-400">
            {data.ielts_tasks.done}/{data.ielts_tasks.total}
          </span>
        }
      >
        <div className="space-y-2">
          {data.ielts_tasks.items.map((t: any) => (
            <button
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className="card flex w-full items-center gap-3 text-left"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  t.done ? "border-brand bg-brand text-white" : "border-slate-500"
                }`}
              >
                {t.done ? "✓" : ""}
              </span>
              <span className="text-xl">{skillEmoji[t.skill]}</span>
              <span className={`flex-1 text-sm ${t.done ? "text-slate-500 line-through" : ""}`}>
                {t.title}
              </span>
            </button>
          ))}
          {data.ielts_tasks.items.length === 0 && (
            <p className="text-sm text-slate-500">No tasks scheduled today.</p>
          )}
        </div>
      </Section>

      {/* Water + Sleep */}
      <Section title="Hydration & Sleep">
        <div className="flex gap-3">
          <div className="card flex flex-1 flex-col items-center">
            <ProgressRing
              value={w.total_ml}
              max={w.goal_ml}
              label={`${(w.total_ml / 1000).toFixed(1)}L`}
              sublabel={`/ ${(w.goal_ml / 1000).toFixed(1)}L`}
            />
            <div className="mt-2 flex gap-2">
              <button className="btn-ghost" onClick={() => addWater(250)}>
                +250
              </button>
              <button className="btn-ghost" onClick={() => addWater(500)}>
                +500
              </button>
            </div>
          </div>
          <div className="card flex flex-1 flex-col justify-center">
            <div className="text-xs uppercase tracking-wide text-slate-400">Sleep</div>
            {data.sleep ? (
              <>
                <div className="text-2xl font-bold">{data.sleep.hours}h</div>
                <div className="text-xs text-slate-400">
                  {data.sleep.bedtime} → {data.sleep.wake_time}
                </div>
              </>
            ) : (
              <Link to="/habits" className="mt-1 text-sm text-brand-light">
                Log last night →
              </Link>
            )}
          </div>
        </div>
      </Section>

      {/* Habits weekly */}
      <Section title="This week's movement" right={<Link to="/habits" className="text-xs text-brand-light">Manage →</Link>}>
        <div className="card space-y-3">
          {Object.entries(data.habits).map(([type, h]: any) => (
            <div key={type}>
              <div className="mb-1 flex justify-between text-sm capitalize">
                <span>{type === "gym" ? "🏋️ Gym" : "🧘 Pilates"}</span>
                <span className="text-slate-400">
                  {h.done}/{h.target}
                </span>
              </div>
              <Bar value={h.done} max={h.target} />
            </div>
          ))}
        </div>
      </Section>

      {/* Content today */}
      {focus.mode === "content" && (
        <Section title="Content time">
          <Link to="/content" className="card block text-center">
            <div className="text-sm text-slate-300">
              {data.content_today.count > 0
                ? `${data.content_today.count} session(s) · ${data.content_today.minutes} min today`
                : "No content logged yet — start building your brand 🚀"}
            </div>
            <div className="mt-1 text-sm text-brand-light">Log a session →</div>
          </Link>
        </Section>
      )}

      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Days left" value={data.days_to_exam} />
        <StatPill label="Water" value={`${(w.total_ml / 1000).toFixed(1)}L`} />
        <StatPill label="IELTS done" value={`${data.ielts_tasks.done}/${data.ielts_tasks.total}`} />
      </div>
    </div>
  );
}
