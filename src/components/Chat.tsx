"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  initialMessage: string | null;
  onInitialMessageSent: () => void;
}

interface ThumbnailResult {
  thumbnailUrls?: string[];
  thumbnail_urls?: string[];
  results?: Array<{ thumbnailUrls?: string[]; thumbnail_url?: string }>;
}

function extractThumbnails(content: string): string[] {
  // Find all JSON objects in the message content
  const urls: string[] = [];
  const jsonPattern = /\{[\s\S]*?\}/g;
  const matches = content.match(jsonPattern) ?? [];
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match) as ThumbnailResult;
      if (parsed.thumbnailUrls) urls.push(...parsed.thumbnailUrls);
      if (parsed.thumbnail_urls) urls.push(...parsed.thumbnail_urls);
      if (parsed.results) {
        for (const r of parsed.results) {
          if (r.thumbnailUrls) urls.push(...r.thumbnailUrls);
          if (r.thumbnail_url) urls.push(r.thumbnail_url);
        }
      }
    } catch {
      // not valid json
    }
  }
  return [...new Set(urls.filter(Boolean))];
}

let msgCounter = 0;
function nextId() {
  return `msg-${++msgCounter}`;
}

export function Chat({ initialMessage, onInitialMessageSent }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, history: Message[] = messages) => {
      if (isLoading) return;
      const userMsg: Message = { id: nextId(), role: "user", content };
      const allMsgs = [...history, userMsg];
      setMessages(allMsgs);
      setIsLoading(true);

      const assistantId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMsgs.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          const msg = data.error ?? "Something went wrong";
          if (msg.toLowerCase().includes("api keys")) setConfigError(true);
          else toast.error(msg);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setIsLoading(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: current } : m
            )
          );
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Connection failed. Check your API keys in Settings.");
        }
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }

      setIsLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, messages]
  );

  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true;
      sendMessage(initialMessage, []);
      onInitialMessageSent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  }

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Bot className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium">SkyFi Agent</span>
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-white/40">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking…
          </div>
        )}
        {isLoading && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="ml-1 text-xs text-white/30 hover:text-white/60"
          >
            stop
          </button>
        )}
      </div>

      {/* Config error banner */}
      {configError && (
        <div className="mx-3 mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            API keys not configured.{" "}
            <Link href="/settings" className="underline hover:text-amber-200">
              Go to Settings
            </Link>{" "}
            to add your SkyFi and AI keys.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-12">
            <Bot className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">
              Ask me about satellite imagery
            </p>
            <p className="text-white/20 text-xs mt-1">
              or draw a polygon on the map to start a search
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const thumbnails = !isUser ? extractThumbnails(msg.content) : [];

          return (
            <div
              key={msg.id}
              className={cn("flex gap-2.5", isUser && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  isUser
                    ? "bg-blue-600/20 border border-blue-600/40"
                    : "bg-white/5 border border-white/10"
                )}
              >
                {isUser ? (
                  <User className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white/60" />
                )}
              </div>

              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "bg-blue-600/20 border border-blue-600/20 text-white"
                    : "bg-[#1a1b23] border border-white/10 text-white/85"
                )}
              >
                {msg.content ? (
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />
                )}

                {thumbnails.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {thumbnails.slice(0, 4).map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden bg-black/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <div className="absolute bottom-1 right-1">
                          <ImageIcon className="w-3 h-3 text-white/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-3 pb-3 pt-2 border-t border-white/10"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search imagery, ask about feasibility…"
            disabled={isLoading}
            className="flex-1 bg-[#1a1b23] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg transition-colors shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
