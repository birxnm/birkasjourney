import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

export type Reminder = {
  id: number;
  time: string;
  purpose: string;
  category: string;
  enabled: boolean;
};

const CATEGORY_ICON: Record<string, string> = {
  ielts: "📚",
  habit: "💪",
  water: "💧",
  sleep: "😴",
  content: "🚀",
  general: "🔔",
};

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

async function fire(r: Reminder) {
  const title = `${CATEGORY_ICON[r.category] || "🔔"} Reminder`;
  const opts: NotificationOptions = { body: r.purpose, tag: `reminder-${r.id}` };
  try {
    // Prefer the service-worker notification (needed on iOS installed PWAs).
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    /* fall through to Notification */
  }
  if (Notification.permission === "granted") new Notification(title, opts);
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const firedKey = (id: number, day: string) => `reminder-fired-${id}-${day}`;

/**
 * Global scheduler. While the app is open it checks every 20s and fires a
 * notification when the current time matches an enabled reminder (once/day).
 */
export function useReminderScheduler() {
  const remindersRef = useRef<Reminder[]>([]);

  const refresh = () => api.reminders().then((r: Reminder[]) => (remindersRef.current = r));

  useEffect(() => {
    refresh();
    const reloadId = setInterval(refresh, 5 * 60 * 1000); // re-sync list every 5 min

    const tickId = setInterval(() => {
      if (Notification?.permission !== "granted") return;
      const hhmm = nowHHMM();
      const day = new Date().toISOString().slice(0, 10);
      for (const r of remindersRef.current) {
        if (!r.enabled || r.time !== hhmm) continue;
        if (localStorage.getItem(firedKey(r.id, day))) continue;
        localStorage.setItem(firedKey(r.id, day), "1");
        fire(r);
      }
    }, 20 * 1000);

    return () => {
      clearInterval(reloadId);
      clearInterval(tickId);
    };
  }, []);

  return { refresh };
}

export function useNotificationPermission() {
  const [perm, setPerm] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const ask = async () => setPerm(await requestNotificationPermission());
  return { perm, ask };
}
