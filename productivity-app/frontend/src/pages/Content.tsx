import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Section } from "../components/ui";
import { isDeepWork } from "../lib/focus";

const platforms = ["Instagram", "TikTok", "YouTube", "LinkedIn", "X/Twitter", "Blog"];

export default function Content() {
  const [items, setItems] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [f, setF] = useState({ platform: "Instagram", description: "", minutes: "30" });

  const load = () => {
    api.content().then(setItems);
    api.contentStreak().then((d) => setStreak(d.streak));
  };
  useEffect(load, []);

  const submit = async () => {
    await api.addContent({
      platform: f.platform,
      description: f.description,
      minutes: parseInt(f.minutes) || 0,
    });
    setF({ platform: f.platform, description: "", minutes: "30" });
    load();
  };
  const del = async (id: number) => {
    await api.deleteContent(id);
    load();
  };

  const deepWork = isDeepWork();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">🚀 Personal Brand</h1>
      <p className="mb-4 text-sm text-slate-400">After 20:00 — build in public, stay consistent.</p>

      <div className="mb-5 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 p-4 text-center">
        <div className="text-3xl font-black">🔥 {streak}</div>
        <div className="text-sm text-white/80">day content streak</div>
      </div>

      {deepWork && (
        <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          It's still deep-work time. Content creation is for after 20:00 — but you can pre-log ideas.
        </div>
      )}

      <Section title="Log a session">
        <div className="card space-y-2">
          <select className="input" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input className="input" placeholder="What did you create / post?" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <div>
            <label className="label">Minutes spent</label>
            <input className="input" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} />
          </div>
          <button className="btn-primary w-full" onClick={submit}>Save session</button>
        </div>
      </Section>

      <Section title="Recent sessions">
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{i.platform}</span>{" "}
                  {i.description || "—"}
                </div>
                <div className="text-xs text-slate-500">{i.date} · {i.minutes} min</div>
              </div>
              <button onClick={() => del(i.id)} className="text-slate-500 hover:text-rose-400">✕</button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">No sessions yet.</p>}
        </div>
      </Section>
    </div>
  );
}
