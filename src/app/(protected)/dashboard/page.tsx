"use client";

import dynamic from "next/dynamic";
import { Chat } from "@/components/Chat";
import { useState } from "react";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1a1b23] flex items-center justify-center text-white/40 text-sm">
      Loading map…
    </div>
  ),
});

export default function DashboardPage() {
  const [aoiWkt, setAoiWkt] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  function handleAoiDrawn(wkt: string) {
    setAoiWkt(wkt);
    setInitialMessage(`I've drawn an AOI: ${wkt}\n\nPlease search for available satellite imagery in this area from the last 30 days.`);
  }

  return (
    <div className="flex h-full">
      {/* Map panel */}
      <div className="flex-1 relative border-r border-white/10">
        <div className="absolute top-3 left-3 z-[1000] bg-[#0f1117]/90 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60">
          Draw a polygon to search for imagery
        </div>
        {aoiWkt && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-cyan-500/20 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs text-cyan-300 max-w-xs truncate">
            AOI ready — ask the AI about it
          </div>
        )}
        <Map onAoiDrawn={handleAoiDrawn} />
      </div>

      {/* Chat panel */}
      <div className="w-[420px] flex flex-col">
        <Chat initialMessage={initialMessage} onInitialMessageSent={() => setInitialMessage(null)} />
      </div>
    </div>
  );
}
