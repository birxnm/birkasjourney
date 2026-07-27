import { Section } from "../components/ui";

const steps = [
  {
    t: "Open Screen Time",
    d: "Settings → Screen Time. Turn it on if you haven't. This is Apple's OS-level blocker — far stricter than any app.",
  },
  {
    t: "Set a Screen Time passcode",
    d: "Tap 'Use Screen Time Passcode'. Pick one you won't remember easily — ideally have a friend set & keep it so you truly can't cave before 20:00.",
  },
  {
    t: "Add an App Limit on Instagram",
    d: "App Limits → Add Limit → Social → Instagram. Set the limit to 1 minute, and turn ON 'Block at End of Limit'. It'll be locked almost immediately each day.",
  },
  {
    t: "Or use a Downtime schedule",
    d: "Downtime → Scheduled → set 00:00–20:00 every day. Add Instagram to 'Always Allowed'? No — leave it OUT so it stays blocked until 20:00.",
  },
  {
    t: "Lock in the schedule",
    d: "With the passcode set, Instagram unlocks itself at 20:00 automatically — exactly when your content-creation window opens.",
  },
];

export default function Setup() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">🔒 Block Instagram till 20:00</h1>
      <p className="mb-4 text-sm text-slate-400">
        A web app can't block phone apps — only iOS can. Here's the one-time setup for a real,
        enforced block.
      </p>

      <div className="mb-5 rounded-xl border border-brand/40 bg-brand/10 p-3 text-sm text-slate-200">
        Why this way? Apple's Screen Time is free, needs no developer account, and genuinely
        prevents the app from opening. This tracker handles everything <em>around</em> the block:
        your IELTS plan, habits, and post-20:00 content time.
      </div>

      <Section title="Setup steps">
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="card flex gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.t}</div>
                <div className="text-sm text-slate-400">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pro tips">
        <div className="card space-y-2 text-sm text-slate-300">
          <p>• Delete the Instagram app and keep only the web version — the block feels stronger.</p>
          <p>• Put coding + IELTS apps in a focus-mode home screen for 00:00–20:00.</p>
          <p>• Pair with an iOS <strong>Focus</strong> (Settings → Focus → Work) to silence notifications too.</p>
        </div>
      </Section>
    </div>
  );
}
