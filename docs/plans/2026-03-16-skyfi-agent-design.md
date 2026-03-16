# SkyFi Agent Web App — Design Document

**Date:** 2026-03-16  
**Status:** Implemented

---

## Goal

Build a hosted web application that puts a polished, user-facing UI on top of the SkyFi Remote MCP Server (project1). Users log in, configure their API keys, and interact with satellite imagery through a natural language AI chat paired with an interactive map.

## Architecture

```
Browser (Next.js App Router)
  ├── /dashboard        → Leaflet map (AOI drawing) + AI chat side by side
  ├── /settings         → SkyFi key + AI provider/key management
  ├── /notifications    → AOI monitoring event history (polls every 30s)
  ├── /login + /signup  → NextAuth credentials auth
  │
  └── API Routes
        ├── /api/chat              → Streams AI response via Vercel AI SDK
        │                            connects to MCP server per request
        ├── /api/webhooks/aoi      → Receives forwarded AOI events from MCP server
        │                            stores to DB + sends Resend email
        ├── /api/settings          → GET/PUT encrypted user API keys
        ├── /api/events            → Polling endpoint for AOI event history
        ├── /api/subscriptions     → Track user's AOI subscriptions
        └── /api/auth/[...nextauth] → NextAuth credential + JWT handler

Railway Postgres
  ├── User              (email + bcrypt password)
  ├── UserSecret        (AES-256-GCM encrypted SkyFi + AI keys)
  ├── AoiSubscription   (user's monitored areas)
  └── AoiEvent          (incoming webhook events)

Railway MCP Server (project1)
  └── Called via StreamableHTTPClientTransport
      with X-Skyfi-Api-Key + X-Skyfi-Notification-Url headers per request
```

## Key Decisions

- **No Supabase** — everything runs on Railway. Postgres for data, bcrypt for auth, pgcrypto-equivalent via Node crypto for key encryption.
- **JWT sessions** — no database session storage; simpler, stateless.
- **Polling for notifications** — 30s interval on `/api/events`. Adequate for satellite imagery cadence; avoids WebSocket complexity.
- **Per-request MCP client** — each `/api/chat` POST creates a fresh `StreamableHTTPClientTransport` and injects user's SkyFi key + notification URL as headers. Stateless, clean.
- **AI SDK v6 + MCP SDK v1.27** — use `jsonSchema()` from ai SDK to wrap MCP tool schemas without Zod conversion.
- **Leaflet + CartoDB dark tiles** — zero API key, dark satellite-style basemap, polygon draw via `leaflet-draw`.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v4 (JWT, credentials) |
| Database | Railway Postgres via Prisma ORM |
| Key encryption | Node.js `crypto` AES-256-GCM |
| AI chat | Vercel AI SDK v6 (`streamText`, `jsonSchema`, `useChat`) |
| AI providers | `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` |
| MCP client | `@modelcontextprotocol/sdk` `StreamableHTTPClientTransport` |
| Map | Leaflet + leaflet-draw + CartoDB dark tiles |
| Notifications | Resend (email) + 30s polling (in-app) |
| Deployment | Railway (Nixpacks, `prisma migrate deploy` on start) |

## Notification Flow

```
SkyFi → POST /webhooks/skyfi (project1 MCP server)
         ↓ forwarded via notification_url header
POST /api/webhooks/aoi?userId=<id> (this app)
         ↓
AoiEvent row created in Postgres
         ↓
Resend email sent (if configured)
         ↓
/notifications page polls /api/events every 30s → user sees alert
NotificationBell polls every 30s → badge count updates
```

## Environment Variables Required

```
DATABASE_URL          Railway Postgres connection string
NEXTAUTH_SECRET       Random secret (openssl rand -base64 32)
NEXTAUTH_URL          Production URL (https://yourapp.railway.app)
ENCRYPTION_KEY        64-char hex (node -e "require('crypto').randomBytes(32).toString('hex')")
MCP_SERVER_URL        Deployed project1 URL (https://mcp.railway.app)
RESEND_API_KEY        From resend.com (optional — email notifications)
RESEND_FROM_EMAIL     Sender address (optional)
```
