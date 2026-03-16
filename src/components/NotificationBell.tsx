"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("skyfi_last_seen_event_count");
    const lastSeen = stored ? parseInt(stored) : 0;

    async function check() {
      try {
        const res = await fetch("/api/events?limit=100");
        const data = await res.json();
        const total = data.count ?? 0;
        const unseen = Math.max(0, total - lastSeen);
        setCount(unseen);
      } catch {
        // ignore
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  function markSeen() {
    // When user clicks notifications, mark all as seen
    fetch("/api/events?limit=100")
      .then((r) => r.json())
      .then((d) => {
        localStorage.setItem(
          "skyfi_last_seen_event_count",
          String(d.count ?? 0)
        );
        setCount(0);
      });
  }

  return (
    <div className="relative" onClick={markSeen}>
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-[10px] font-bold text-black rounded-full flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}
