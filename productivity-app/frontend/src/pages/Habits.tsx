import { useEffect, useState } from "react";
import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { api } from "../api/client";
import { Bar, ProgressRing, Section } from "../components/ui";

export default function Habits() {
  const [habits, setHabits] = useState<any>(null);
  const [water, setWater] = useState<any>(null);
  const [waterStreak, setWaterStreak] = useState(0);
  const [sleep, setSleep] = useState<any[]>([]);
  const [sleepForm, setSleepForm] = useState({ bedtime: "23:30", wake_time: "07:00", quality: "4" });
  const [showHabit, setShowHabit] = useState(false);
  const [habitForm, setHabitForm] = useState({ name: "", emoji: "✅", weekly_target: "3" });

  const load = () => {
    api.habits().then((d) => setHabits(d.habits));
    api.water().then(setWater);
    api.waterStreak().then((d) => setWaterStreak(d.streak));
    api.sleepList().then(setSleep);
  };
  useEffect(load, []);

  const toggle = async (type: string) => {
    await api.toggleHabit(type);
    load();
  };
  const addWater = async (ml: number) => {
    await api.addWater(ml);
    load();
  };
  const saveSleep = async () => {
    await api.logSleep(sleepForm.bedtime, sleepForm.wake_time, parseInt(sleepForm.quality));
    load();
  };
  const addHabit = async () => {
    if (!habitForm.name.trim()) return;
    await api.addHabit(habitForm.name, habitForm.emoji || "✅", parseInt(habitForm.weekly_target) || 1);
    setHabitForm({ name: "", emoji: "✅", weekly_target: "3" });
    setShowHabit(false);
    load();
  };
  const removeHabit = async (name: string) => {
    await api.deleteHabit(name);
    load();
  };

  if (!habits || !water) return <div className="text-slate-400">Loading…</div>;

  const todayISO = new Date().toISOString().slice(0, 10);
  const sleepChart = sleep.map((s: any) => ({ date: s.date.slice(5), hours: s.hours }));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">💪 Habits</h1>

      <Section
        title="Movement this week"
        right={
          <button className="btn-primary !px-2 !py-1" onClick={() => setShowHabit((s) => !s)}>
            {showHabit ? "Close" : "+ Add"}
          </button>
        }
      >
        {showHabit && (
          <div className="card mb-3 space-y-2">
            <div className="flex gap-2">
              <input
                className="input w-16 text-center text-xl"
                value={habitForm.emoji}
                onChange={(e) => setHabitForm({ ...habitForm, emoji: e.target.value })}
              />
              <input
                className="input flex-1"
                placeholder="Habit name (e.g. reading, running)"
                value={habitForm.name}
                onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="label mb-0 flex-1">Times per week</label>
              <input
                className="input w-20 text-center"
                value={habitForm.weekly_target}
                onChange={(e) => setHabitForm({ ...habitForm, weekly_target: e.target.value })}
              />
              <button className="btn-primary" onClick={addHabit}>
                Add
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(habits).map(([name, data]: any) => (
            <HabitCard
              key={name}
              name={name}
              data={data}
              done={data.dates.includes(todayISO)}
              onToggle={() => toggle(name)}
              onDelete={() => removeHabit(name)}
            />
          ))}
        </div>
      </Section>

      <Section title="Water" right={<span className="text-xs text-slate-400">🔥 {waterStreak}-day streak</span>}>
        <div className="card flex items-center gap-4">
          <ProgressRing
            value={water.total_ml}
            max={water.goal_ml}
            label={`${(water.total_ml / 1000).toFixed(1)}L`}
            sublabel={`/ ${(water.goal_ml / 1000).toFixed(1)}L`}
          />
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {[200, 250, 500].map((ml) => (
                <button key={ml} className="btn-ghost" onClick={() => addWater(ml)}>
                  +{ml}
                </button>
              ))}
            </div>
            <button className="btn-ghost w-full text-slate-400" onClick={async () => { await api.resetWater(); load(); }}>
              Reset today
            </button>
          </div>
        </div>
      </Section>

      <Section title="Sleep">
        <div className="card space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Bedtime</label>
              <input type="time" className="input" value={sleepForm.bedtime} onChange={(e) => setSleepForm({ ...sleepForm, bedtime: e.target.value })} />
            </div>
            <div>
              <label className="label">Wake</label>
              <input type="time" className="input" value={sleepForm.wake_time} onChange={(e) => setSleepForm({ ...sleepForm, wake_time: e.target.value })} />
            </div>
            <div>
              <label className="label">Quality 1-5</label>
              <input className="input" value={sleepForm.quality} onChange={(e) => setSleepForm({ ...sleepForm, quality: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary w-full" onClick={saveSleep}>Log sleep</button>
        </div>
        {sleepChart.length > 0 && (
          <div className="card mt-3" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} />
                <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="4 4" />
                <RBar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>
    </div>
  );
}

function HabitCard({ name, data, done, onToggle, onDelete }: any) {
  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xl">{data.emoji}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {data.done}/{data.target}
          </span>
          <button onClick={onDelete} className="text-xs text-slate-600 hover:text-rose-400">
            ✕
          </button>
        </div>
      </div>
      <div className="mb-1 text-sm font-medium capitalize">{name}</div>
      <Bar value={data.done} max={data.target} />
      <button
        onClick={onToggle}
        className={`mt-3 w-full rounded-xl py-2 text-sm font-medium ${
          done ? "bg-green-600 text-white" : "bg-slate-700 text-slate-200"
        }`}
      >
        {done ? "✓ Done today" : "Mark today"}
      </button>
    </div>
  );
}
