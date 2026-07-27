// Focus-mode logic. Before 20:00 = deep work (coding + IELTS, Instagram blocked
// by iOS Screen Time). At/after 20:00 = content-creation / personal-brand time.
export const FOCUS_END_HOUR = 20;

export function isDeepWork(now = new Date()): boolean {
  return now.getHours() < FOCUS_END_HOUR;
}

export function focusStatus(now = new Date()) {
  if (isDeepWork(now)) {
    const minsLeft =
      (FOCUS_END_HOUR - now.getHours()) * 60 - now.getMinutes();
    const h = Math.floor(minsLeft / 60);
    const m = minsLeft % 60;
    return {
      mode: "deep" as const,
      title: "Deep Work — Coding + IELTS",
      subtitle: `Instagram blocked · ${h}h ${m}m until content time`,
      emoji: "🎯",
    };
  }
  return {
    mode: "content" as const,
    title: "Content Creation Time",
    subtitle: "Build your personal brand on social media",
    emoji: "🚀",
  };
}
