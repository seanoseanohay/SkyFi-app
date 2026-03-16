import Link from "next/link";
import { Satellite, Map, Bell, Zap, Shield, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className="w-6 h-6 text-cyan-400" />
          <span className="font-bold text-lg tracking-tight">SkyFi Agent</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-1.5 text-cyan-400 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          Powered by the SkyFi MCP Server
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
          Satellite imagery,
          <br />
          <span className="text-cyan-400">conversationally.</span>
        </h1>

        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
          Search archives, check feasibility, price and order imagery, and
          monitor areas of interest — all through a natural language AI
          interface. Bring your own Claude, ChatGPT, or Gemini key.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
          >
            Start for free
          </Link>
          <a
            href="https://github.com/lawrencekeener/skyfi-mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
          >
            View MCP server →
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Globe,
              title: "Draw AOIs on a map",
              desc: "Sketch any polygon — we convert it to coordinates and search SkyFi archives instantly.",
            },
            {
              icon: Zap,
              title: "Any AI provider",
              desc: "Connect Claude, ChatGPT, or Gemini with your own API key. Switch providers anytime.",
            },
            {
              icon: Shield,
              title: "Safe ordering",
              desc: "Every order requires explicit confirmation. Your API key, your wallet — no surprises.",
            },
            {
              icon: Bell,
              title: "AOI monitoring alerts",
              desc: "Watch any area for new collects. Get in-app and email notifications the moment imagery arrives.",
            },
            {
              icon: Map,
              title: "Visual thumbnails",
              desc: "Preview imagery before you buy. Thumbnails render inline in the chat.",
            },
            {
              icon: Satellite,
              title: "SAR + optical",
              desc: "Search optical and SAR providers. The AI suggests SAR when cloud cover is high.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[#1a1b23] border border-white/10 rounded-xl p-6"
            >
              <Icon className="w-5 h-5 text-cyan-400 mb-3" />
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-white/40 text-sm">
        Built on the open-source{" "}
        <a
          href="https://github.com"
          className="text-white/60 hover:text-white transition-colors"
        >
          SkyFi MCP Server
        </a>
        . MIT licensed.
      </footer>
    </div>
  );
}
