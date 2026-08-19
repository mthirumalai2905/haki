# Haki

AI-powered multi-channel outbound infrastructure.

Haki does not source or scrape leads. You upload a dataset. Haki normalizes it, qualifies it, builds a workflow, and runs outreach in simulation mode until real providers are connected.

```
DATA → LEADS → AI → GOAL → WORKFLOW → MULTI-CHANNEL OUTREACH → CONVERSATIONS → OUTCOMES
```

## Stack

- Next.js App Router
- Prisma + SQLite
- DeepSeek behind a single AI layer
- Simulation-mode channel providers
- Backend-driven campaign execution

## Setup

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: copy `.env.example` to `.env` and set `DEEPSEEK_API_KEY`. Without a key, Haki uses local heuristics for qualification, workflow generation, and messages.

## Product flow

Upload → Map → Preview → Import → Qualify → Campaign → Workflow → Messages → Launch → Monitor → Analyze

Campaign execution runs on the server. Simulated actions are labeled and never presented as real outreach.
