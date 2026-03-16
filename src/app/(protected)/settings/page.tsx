"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, Key, Bot, Satellite } from "lucide-react";
import { toast } from "sonner";

const AI_PROVIDERS = [
  {
    id: "claude",
    name: "Claude",
    company: "Anthropic",
    hint: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "ChatGPT / GPT-4o",
    company: "OpenAI",
    hint: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    name: "Gemini",
    company: "Google",
    hint: "https://aistudio.google.com/app/apikey",
  },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";

  const [skyfiKey, setSkyfiKey] = useState("");
  const [aiProvider, setAiProvider] = useState("claude");
  const [aiKey, setAiKey] = useState("");
  const [current, setCurrent] = useState<{
    skyfiKeySet: boolean;
    aiProvider: string;
    aiKeySet: boolean;
    skyfiKeyPreview?: string;
    aiKeyPreview?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d);
        setAiProvider(d.aiProvider ?? "claude");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, string> = { aiProvider };
    if (skyfiKey) body.skyfiKey = skyfiKey;
    if (aiKey) body.aiKey = aiKey;

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Settings saved");
      setSkyfiKey("");
      setAiKey("");
      const updated = await fetch("/api/settings").then((r) => r.json());
      setCurrent(updated);
    } else {
      toast.error("Failed to save settings");
    }
  }

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-xl mx-auto">
        {isOnboarding && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 mb-8 text-sm text-blue-300">
            👋 Welcome! Set up your API keys below to start chatting with
            satellite imagery.
          </div>
        )}

        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-white/50 text-sm mb-8">
          Your keys are encrypted at rest and never shared.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* SkyFi API Key */}
          <div className="bg-[#1a1b23] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Satellite className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold">SkyFi API Key</h2>
              {current?.skyfiKeySet && (
                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
              )}
            </div>
            <p className="text-white/50 text-xs mb-4">
              Get your key at{" "}
              <a
                href="https://app.skyfi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                app.skyfi.com
              </a>
            </p>
            <input
              type="password"
              value={skyfiKey}
              onChange={(e) => setSkyfiKey(e.target.value)}
              placeholder={
                current?.skyfiKeyPreview ?? "Enter your SkyFi API key"
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono"
            />
          </div>

          {/* AI Provider */}
          <div className="bg-[#1a1b23] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold">AI Provider</h2>
              {current?.aiKeySet && (
                <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
              )}
            </div>
            <p className="text-white/50 text-xs mb-4">
              Choose which AI powers your conversations.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAiProvider(p.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    aiProvider === p.id
                      ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                {selectedProvider?.company} API Key —{" "}
                <a
                  href={selectedProvider?.hint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  get one here
                </a>
              </label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder={
                  current?.aiKeyPreview ??
                  `Enter your ${selectedProvider?.company} API key`
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            Save settings
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-white/40 text-sm">Loading…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
