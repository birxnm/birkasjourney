import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import { Bar, Section } from "../components/ui";

const skillMeta: Record<string, { emoji: string; label: string }> = {
  listening: { emoji: "🎧", label: "Listening" },
  reading: { emoji: "📖", label: "Reading" },
  writing: { emoji: "✍️", label: "Writing" },
  speaking: { emoji: "🗣️", label: "Speaking" },
};

const tabs = ["Overview", "Writing", "Speaking", "Errors"] as const;
type Tab = (typeof tabs)[number];

export default function Ielts() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [targets, setTargets] = useState<any[]>([]);
  const [mocks, setMocks] = useState<any[]>([]);
  const [writing, setWriting] = useState<any[]>([]);
  const [speaking, setSpeaking] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const loadTasks = () => api.tasks().then(setTasks);
  const loadAll = () => {
    api.targets().then(setTargets);
    api.mocks().then(setMocks);
    api.writing().then(setWriting);
    api.speaking().then(setSpeaking);
    api.errors().then(setErrors);
    loadTasks();
  };
  useEffect(loadAll, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">📚 IELTS → 8.5</h1>
      <p className="mb-4 text-sm text-slate-400">
        Writing & Speaking are your focus. L/R just need maintaining at 9.0.
      </p>

      <div className="mb-5 flex gap-1 rounded-xl bg-slate-800/60 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
              tab === t ? "bg-brand text-white" : "text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <Overview
          targets={targets}
          mocks={mocks}
          tasks={tasks}
          onChange={loadAll}
          onTasksChange={loadTasks}
        />
      )}
      {tab === "Writing" && (
        <WritingTab items={writing} onChange={() => api.writing().then(setWriting)} />
      )}
      {tab === "Speaking" && (
        <SpeakingTab items={speaking} onChange={() => api.speaking().then(setSpeaking)} />
      )}
      {tab === "Errors" && (
        <ErrorsTab items={errors} onChange={() => api.errors().then(setErrors)} />
      )}
    </div>
  );
}

function Overview({ targets, mocks, tasks, onChange, onTasksChange }: any) {
  const [form, setForm] = useState({ listening: "8.5", reading: "9", writing: "6.5", speaking: "7" });
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", skill: "writing" });

  const submit = async () => {
    await api.addMock({
      listening: parseFloat(form.listening),
      reading: parseFloat(form.reading),
      writing: parseFloat(form.writing),
      speaking: parseFloat(form.speaking),
    });
    onChange();
  };

  const addTask = async () => {
    if (!taskForm.title.trim()) return;
    await api.addTask({ title: taskForm.title, skill: taskForm.skill });
    setTaskForm({ title: "", skill: "writing" });
    setShowTask(false);
    onTasksChange();
  };
  const toggleTask = async (id: number) => {
    await api.toggleTask(id);
    onTasksChange();
  };
  const delTask = async (id: number) => {
    await api.deleteTask(id);
    onTasksChange();
  };

  const chartData = mocks.map((m: any) => ({
    date: m.date.slice(5),
    overall: m.overall,
    writing: m.writing,
    speaking: m.speaking,
  }));

  return (
    <div>
      <Section
        title="Today's tasks"
        right={
          <button className="btn-primary !px-2 !py-1" onClick={() => setShowTask((s) => !s)}>
            {showTask ? "Close" : "+ Add"}
          </button>
        }
      >
        {showTask && (
          <div className="card mb-2 space-y-2">
            <input
              className="input"
              placeholder="Task title (e.g. Rewrite intro paragraph)"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            />
            <div className="flex gap-2">
              <select
                className="input"
                value={taskForm.skill}
                onChange={(e) => setTaskForm({ ...taskForm, skill: e.target.value })}
              >
                {Object.entries(skillMeta).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={addTask}>
                Add
              </button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {tasks.map((t: any) => (
            <div key={t.id} className="card flex items-center gap-3">
              <button
                onClick={() => toggleTask(t.id)}
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  t.done ? "border-brand bg-brand text-white" : "border-slate-500"
                }`}
              >
                {t.done ? "✓" : ""}
              </button>
              <span className="text-lg">{skillMeta[t.skill]?.emoji || "📌"}</span>
              <span className={`flex-1 text-sm ${t.done ? "text-slate-500 line-through" : ""}`}>
                {t.title}
              </span>
              <button onClick={() => delTask(t.id)} className="text-slate-500 hover:text-rose-400">
                ✕
              </button>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks today. Add one!</p>}
        </div>
      </Section>

      <Section title="Band targets">
        <div className="card space-y-3">
          {targets.map((t: any) => {
            const meta = skillMeta[t.skill];
            return (
              <div key={t.skill}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {meta.emoji} {meta.label}
                  </span>
                  <span className="text-slate-400">
                    {t.current_band || "—"} / target {t.target_band}
                  </span>
                </div>
                <Bar value={t.current_band} max={9} />
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Mock test trend">
        {chartData.length > 0 ? (
          <div className="card" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[5, 9]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }}
                />
                <ReferenceLine y={8.5} stroke="#22c55e" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="overall" stroke="#4f46e5" strokeWidth={2} />
                <Line type="monotone" dataKey="writing" stroke="#f59e0b" strokeWidth={1.5} />
                <Line type="monotone" dataKey="speaking" stroke="#ec4899" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Log a mock test to see your trend vs the 8.5 line.</p>
        )}
      </Section>

      <Section title="Log a mock test">
        <div className="card grid grid-cols-4 gap-2">
          {(["listening", "reading", "writing", "speaking"] as const).map((k) => (
            <div key={k}>
              <label className="label capitalize">{k.slice(0, 1).toUpperCase()}</label>
              <input
                className="input text-center"
                value={(form as any)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <button className="btn-primary col-span-4 mt-1" onClick={submit}>
            Save mock test
          </button>
        </div>
      </Section>
    </div>
  );
}

function bandTrend(items: any[]) {
  return items
    .filter((i) => i.self_band > 0)
    .map((i) => ({ date: i.date.slice(5), band: i.self_band }));
}

function WritingTab({ items, onChange }: any) {
  const [f, setF] = useState({ prompt: "", word_count: "", minutes: "40", self_band: "6.5", notes: "" });
  const submit = async () => {
    if (!f.prompt) return;
    await api.addWriting({
      prompt: f.prompt,
      word_count: parseInt(f.word_count) || 0,
      minutes: parseInt(f.minutes) || 0,
      self_band: parseFloat(f.self_band) || 0,
      notes: f.notes,
    });
    setF({ prompt: "", word_count: "", minutes: "40", self_band: "6.5", notes: "" });
    onChange();
  };
  const data = bandTrend(items);
  return (
    <div>
      <Section title="Self-band trend (target 7.0)">
        <TrendChart data={data} target={7.0} color="#f59e0b" />
      </Section>
      <Section title="New writing entry">
        <div className="card space-y-2">
          <input className="input" placeholder="Essay prompt / question" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Words</label><input className="input" value={f.word_count} onChange={(e) => setF({ ...f, word_count: e.target.value })} /></div>
            <div><label className="label">Minutes</label><input className="input" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></div>
            <div><label className="label">Self band</label><input className="input" value={f.self_band} onChange={(e) => setF({ ...f, self_band: e.target.value })} /></div>
          </div>
          <input className="input" placeholder="Notes (linkers, mistakes…)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <button className="btn-primary w-full" onClick={submit}>Save</button>
        </div>
      </Section>
      <LogList items={items} render={(i: any) => `${i.date.slice(5)} · ${i.prompt} — ${i.word_count}w · band ${i.self_band}`} />
    </div>
  );
}

function SpeakingTab({ items, onChange }: any) {
  const [f, setF] = useState({ topic: "", part: "2", minutes: "2", self_band: "7", notes: "" });
  const submit = async () => {
    if (!f.topic) return;
    await api.addSpeaking({
      topic: f.topic,
      part: parseInt(f.part) || 2,
      minutes: parseInt(f.minutes) || 0,
      self_band: parseFloat(f.self_band) || 0,
      notes: f.notes,
    });
    setF({ topic: "", part: "2", minutes: "2", self_band: "7", notes: "" });
    onChange();
  };
  const data = bandTrend(items);
  return (
    <div>
      <Section title="Self-band trend (target 8.0)">
        <TrendChart data={data} target={8.0} color="#ec4899" />
      </Section>
      <Section title="New speaking entry">
        <div className="card space-y-2">
          <input className="input" placeholder="Topic / cue card" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Part</label><input className="input" value={f.part} onChange={(e) => setF({ ...f, part: e.target.value })} /></div>
            <div><label className="label">Minutes</label><input className="input" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></div>
            <div><label className="label">Self band</label><input className="input" value={f.self_band} onChange={(e) => setF({ ...f, self_band: e.target.value })} /></div>
          </div>
          <input className="input" placeholder="Notes (fluency, pronunciation…)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <button className="btn-primary w-full" onClick={submit}>Save</button>
        </div>
      </Section>
      <LogList items={items} render={(i: any) => `${i.date.slice(5)} · Part ${i.part} · ${i.topic} — band ${i.self_band}`} />
    </div>
  );
}

function ErrorsTab({ items, onChange }: any) {
  const [f, setF] = useState({ category: "grammar", note: "" });
  const submit = async () => {
    if (!f.note) return;
    await api.addError(f.category, f.note);
    setF({ category: "grammar", note: "" });
    onChange();
  };
  const toggle = async (id: number) => {
    await api.resolveError(id);
    onChange();
  };
  return (
    <div>
      <Section title="Add to error log">
        <div className="card space-y-2">
          <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {["grammar", "vocab", "collocation", "linker"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input className="input" placeholder="e.g. 'depend on' not 'depend of'" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="btn-primary w-full" onClick={submit}>Add</button>
        </div>
      </Section>
      <Section title="Review list">
        <div className="space-y-2">
          {items.map((i: any) => (
            <button key={i.id} onClick={() => toggle(i.id)} className="card flex w-full items-center gap-2 text-left">
              <span className={`h-4 w-4 rounded-full ${i.resolved ? "bg-green-500" : "border border-slate-500"}`} />
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">{i.category}</span>
              <span className={`flex-1 text-sm ${i.resolved ? "text-slate-500 line-through" : ""}`}>{i.note}</span>
            </button>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No errors logged yet.</p>}
        </div>
      </Section>
    </div>
  );
}

function TrendChart({ data, target, color }: { data: any[]; target: number; color: string }) {
  if (data.length === 0)
    return <p className="text-sm text-slate-500">Log entries with a self-band to see your trend.</p>;
  return (
    <div className="card" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
          <YAxis domain={[5, 9]} stroke="#94a3b8" fontSize={11} />
          <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} />
          <ReferenceLine y={target} stroke="#22c55e" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="band" stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function LogList({ items, render }: { items: any[]; render: (i: any) => string }) {
  return (
    <Section title="History">
      <div className="space-y-2">
        {[...items].reverse().map((i: any) => (
          <div key={i.id} className="card text-sm text-slate-300">
            {render(i)}
            {i.notes && <div className="mt-1 text-xs text-slate-500">{i.notes}</div>}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">Nothing logged yet.</p>}
      </div>
    </Section>
  );
}
