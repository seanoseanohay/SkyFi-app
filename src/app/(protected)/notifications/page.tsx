"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, RefreshCw, ExternalLink, Satellite } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AoiEvent {
  id: string;
  subscriptionId: string | null;
  payload: Record<string, unknown>;
  purchaseInvitation: {
    thumbnail_url?: string;
    guidance_message?: string;
    provider?: string;
    product?: string;
    archive_id?: string;
  } | null;
  emailSent: boolean;
  createdAt: string;
  subscription: { label: string | null } | null;
}

export default function NotificationsPage() {
  const [events, setEvents] = useState<AoiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events?limit=50");
    const data = await res.json();
    setEvents(data.events ?? []);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    // Poll every 30 seconds
    const interval = setInterval(fetchEvents, 30_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-cyan-400" />
              Monitoring Alerts
            </h1>
            <p className="text-white/50 text-sm mt-1">
              New collects for your watched areas
            </p>
          </div>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <p className="text-white/30 text-xs mb-6">
          Last refreshed {formatDistanceToNow(lastRefresh, { addSuffix: true })} · auto-updates every 30s
        </p>

        {events.length === 0 && !loading && (
          <div className="bg-[#1a1b23] border border-white/10 rounded-xl p-12 text-center">
            <Satellite className="w-10 h-10 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-sm">No monitoring events yet</p>
            <p className="text-white/25 text-xs mt-1">
              Set up AOI monitoring in the dashboard chat to start receiving alerts
            </p>
          </div>
        )}

        <div className="space-y-4">
          {events.map((event) => {
            const invite = event.purchaseInvitation;
            const label =
              event.subscription?.label ??
              event.subscriptionId ??
              "Unknown area";
            return (
              <div
                key={event.id}
                className="bg-[#1a1b23] border border-white/10 rounded-xl overflow-hidden"
              >
                {invite?.thumbnail_url && (
                  <div className="relative aspect-video bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={invite.thumbnail_url}
                      alt="Satellite thumbnail"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-0.5 text-xs text-cyan-300 font-mono">
                      {invite.provider ?? "Unknown provider"}
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-white/50 text-xs mt-0.5">
                        {formatDistanceToNow(new Date(event.createdAt), {
                          addSuffix: true,
                        })}
                        {event.emailSent && (
                          <span className="ml-2 text-green-400">
                            · email sent
                          </span>
                        )}
                      </p>
                    </div>
                    {invite?.archive_id && (
                      <a
                        href={`https://app.skyfi.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg px-2.5 py-1.5"
                      >
                        View in SkyFi
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {invite?.guidance_message && (
                    <p className="mt-3 text-white/60 text-xs leading-relaxed bg-white/5 rounded-lg p-3">
                      {invite.guidance_message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
