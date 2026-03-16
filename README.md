# SkyFi Agent

An AI-powered web interface for the [SkyFi Remote MCP Server](../project1). Search satellite imagery, check feasibility, order imagery, and monitor areas of interest — all through natural language.

## Features

- **AI chat** — talk to satellite imagery data using Claude, ChatGPT, or Gemini
- **Interactive map** — draw polygon AOIs on a dark Leaflet map, then search or monitor them
- **Safe ordering** — every order requires explicit confirmation; costs are shown before purchase
- **AOI monitoring** — watch any area for new satellite collects; receive in-app + email alerts
- **Bring your own keys** — connect your own SkyFi and AI provider API keys, stored encrypted

## Stack

- Next.js 16 (App Router)
- NextAuth.js v4 (email/password, JWT)
- Prisma 7 + PostgreSQL (Railway)
- Vercel AI SDK v6 + `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`
- `@modelcontextprotocol/sdk` (StreamableHTTP client)
- Leaflet + leaflet-draw + CartoDB dark tiles
- Resend (email notifications)

## Prerequisites

1. **Deploy [project1](../project1)** to Railway — this app calls it as its backend
2. **PostgreSQL** — Railway provides one automatically
3. **Resend account** (optional) — for email notifications
4. **AI provider API key** — Anthropic, OpenAI, or Google

## Setup

```bash
npm install
cp .env.example .env
# Fill in .env values (see below)
npx prisma migrate dev
npm run dev
```

## Environment Variables

```env
DATABASE_URL=          # Railway Postgres URL
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=          # https://yourapp.railway.app
ENCRYPTION_KEY=        # node -e "require('crypto').randomBytes(32).toString('hex')"
MCP_SERVER_URL=        # https://your-mcp-server.railway.app
RESEND_API_KEY=        # optional — for email alerts
RESEND_FROM_EMAIL=     # optional — sender address
```

## Deploy to Railway

1. Create a new Railway project and add a **PostgreSQL** service.
2. Deploy this repo (connect GitHub). Railway uses Nixpacks with Node 20 (`nixpacks.toml` + `.nvmrc`).
3. **SkyFi-app** service → **Variables** → add **DATABASE_URL** as a **reference**: choose the Postgres service and `DATABASE_URL`. (Required; without it the app will crash at startup.)
4. Set the rest of the env vars (see list above). Railway runs `npx prisma migrate deploy && npm run start` on start.

## How it works

```
Browser → /api/chat (Next.js API route)
            ↓ creates StreamableHTTPClientTransport
            ↓ injects X-Skyfi-Api-Key + X-Skyfi-Notification-Url
            ↓ connects to MCP server (project1)
            ↓ lists tools, calls them via AI provider
            ↓ streams text response back to browser

SkyFi → MCP server webhook → /api/webhooks/aoi?userId=XXX
          ↓ stores event in Postgres
          ↓ sends Resend email
          ↓ /notifications page polls every 30s
```

## Relationship to project1

This app **never modifies project1**. It calls the deployed MCP server as an HTTP dependency. Project1 remains unchanged and open-source; this app is a consumer of it.
