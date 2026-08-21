# Haki

This file is the A-to-Z brief for Haki. Use it to understand the product, the current codebase, what is shipped versus still specified, and where to suggest improvements. Do not invent customers, scraped listing sites, or real sends that the product does not do.

**Brand:** Haki is **an MK Labs Product**.

**Repo:** `D:\Haki` (workspace root). Remote: `https://github.com/mthirumalai2905/haki`. App name in `package.json`: `haki` `0.1.0`.

---

## 1. One-sentence product

Haki is an AI-powered **multi-channel outbound operating system**. The operator brings a list they already have, names a goal, reviews a drafted workflow, and Haki runs the path (today in **simulation**, unless live Resend send is explicitly enabled). It is not an email blaster and not a lead-scraping database.

Operator sentence the product should feel like:

> I give Haki my leads, tell Haki who I want to reach and what I want to achieve, and Haki builds and manages the outreach workflow.

What it is not:

> CSV in, one email blast out.

Mental model:

```
DATA → LEADS → AI → GOAL → WORKFLOW → MULTI CHANNEL OUTREACH → CONVERSATIONS → OUTCOMES
```

Email is one channel, not the product.

---

## 2. Non-negotiable rules

1. **Do not scrape** Zillow, Redfin, LinkedIn, Google, Maps, Crunchbase, Apollo, ZoomInfo, or similar listing/people databases.
2. **Do not invent** emails or phones. Missing fields stay empty.
3. **Do not launch** a campaign from raw AI output. Flow is: request → AI → structured result → validation → operator review → execution.
4. **Do not fake** a successful real send. Resend can be configured for email, but campaigns stay **simulated** until `RESEND_SEND_ENABLED=true`. Other channels stay simulation adapters.
5. **Never expose** DeepSeek, Resend, or other secrets to the client. Keys live in server env only. Never commit `.env`.
6. **Do not overbuild.** Prefer infrastructure that later providers can plug into.
7. **Keep the lead model** independent of the original file or source system.
8. **Preserve custom fields.** Unknown columns are not discarded.
9. **Companies and contacts** are separate. One company can have many contacts.
10. Copy should sound like an operator wrote it. Avoid long em dashes and generic “AI platform” sludge.
11. Landing and marketing must not claim Google, SpaceX, Harvard, or similar as customers. File widgets (CSV / XLSX / JSON) mean “bring a list you already have,” not social proof.

---

## 3. Intended operator flow (spec)

```
Upload → Preview → Map fields → Validate → Import
→ Qualify → Create campaign → Build workflow → Generate messages
→ Review → Launch → Monitor → Analyze
```

Haki starts after sourcing. Sourcing is external (CSV/XLSX/JSON, CRM export, an existing file) except **Haki Universal (Beta)**, which only queries allowed open-data APIs.

Reusable paths start on **Sequences** (template → preview → builder → library), then attach to a campaign. Chat on Haki AI can also draft a campaign in place.

---

## 4. Who it is for

- Operators who already have a list (bought, exported, or collected elsewhere).
- Agencies running client outreach who need preview and review before a touch.
- Founders who want meetings and conversations, not a second CRM.

If the user still needs a database of strangers, they are earlier than core Haki. Universal (Beta) is a narrow open-data exception, not a ZoomInfo replacement.

---

## 5. Stack (how it is built)

| Layer | Choice |
| --- | --- |
| Framework | Next.js **16.3.1** (App Router). Read `node_modules/next/dist/docs/` before writing Next APIs. This Next is not the Next from older training data. |
| UI | React **19.2.8**, TypeScript, Tailwind CSS **4** |
| Motion | `motion` (Framer Motion successor) |
| Workflow canvas | `@xyflow/react` |
| Command palette | `cmdk` |
| Icons | `lucide-react` (this version has **no** `Instagram` / `Linkedin` / `Youtube` exports. Use `Camera`, `UserRound`, `Video`.) |
| CSV / XLSX | `papaparse`, `xlsx` |
| Validation | `zod` |
| ORM / DB | Prisma 6, **SQLite** via `DATABASE_URL` |
| AI | DeepSeek, server-only (`src/lib/ai/deepseek.ts`, facade `src/lib/ai/index.ts`) |
| Also in package.json | `@langchain/core`, `@langchain/langgraph` (present; chat and Universal use the DeepSeek + tool layer more directly) |
| Email | Resend via `fetch` in `src/lib/email/resend.ts`. No `resend` npm package. |
| Fonts | Inter, Geist Mono, Instrument Serif (`src/app/layout.tsx`) |
| Auth | **None.** Single implicit workspace (`getWorkspace()` takes the first Workspace or creates “Haki”). |
| Multi-tenant | Schema is workspace-scoped. Runtime is one local workspace. |

Scripts: `npm run dev` (Next), `build` (prisma generate + next build), `start`, `lint`, `db:generate`, `db:push`. `postinstall` runs `prisma generate`.

Dev server is typically `http://localhost:3000`.

Environment (server):

- `DATABASE_URL` (SQLite)
- `DEEPSEEK_API_KEY` (required for live model; otherwise fallbacks)
- `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`)
- `DEEPSEEK_MODEL` (default `deepseek-chat`)
- `RESEND_API_KEY` (server only. Verified with GET `https://api.resend.com/domains`. Do not send mail to verify.)
- `RESEND_FROM` (verified sender, e.g. `Haki <noreply@yourdomain.com>`)
- `RESEND_SEND_ENABLED` (`true` to allow campaign email. Default off. Campaigns stay simulated.)

UI tokens live in `src/app/globals.css` (`--paper`, `--ink`, `--accent` #007aff, `--sim`, `--sidebar`, etc.). App chrome is a mac-like window over a landscape background (`AppFrame`).

Document title/description: “Haki” / “The outreach OS for lists you already have…” (`src/app/layout.tsx`).

---

## 6. Repository map

```
prisma/schema.prisma          Data model
public/                       Walkthrough video, sample CSV, landscape, icons
src/app/page.tsx              Landing
src/app/haki/                 Haki AI. /haki and /haki/[sessionId]
src/app/universal/            Haki Universal Beta
src/app/overview/             Workspace overview
src/app/hermes/               Server redirect → /sequences
src/app/leads/                Lead table + /leads/import
src/app/campaigns/            List, /new (studio), /[id] Sequence desk + canvas
src/app/sequences/            Templates, /[id] preview, /builder, /library
src/app/analytics/            Metrics
src/app/settings/             Workspace + DeepSeek + Resend check + sample + flush sessions
src/app/api/                  Route handlers (JSON { success, data } or error)
src/components/landing/       Marketing page + product desk
src/components/haki/          Haki AI home, preview, markdown
src/components/universal/     Plan + live collection table + record panel
src/components/layout/        AppFrame, Sidebar, TopBar, CommandPalette
src/components/workflow/      Canvas, HakiNode, palette, inspector, look.ts
src/components/sequence/      SequenceNav + SequenceDesk (campaign)
src/components/leads/         Lead drawer
src/lib/ai/                   Facade + DeepSeek + fallbacks
src/lib/hermes/               Orchestrator, tools, scope, local, prose
src/lib/sequence/             Spec, compile, persist, patch, templates, seed
src/lib/email/                Resend check + send
src/lib/video/                Simulated per-lead video jobs
src/lib/import/               Parse, map, validate, normalize
src/lib/workflow/             Defaults, multitouch, ops, revise, nodes
src/lib/execution/            Engine, scheduler, channels, personalize
src/lib/universal/            Plan + Wikidata + Overpass
src/lib/campaigns/            Sync proposal ↔ campaign, dummy campaign
src/lib/haki/session.ts       Client workspace-session helpers
src/instrumentation.ts        Starts in-process scheduler on Node runtime
```

Client fetch helper: `src/lib/api.ts` (`api<T>(url)` unwraps `{ success, data }`).

---

## 7. Data model (Prisma / SQLite)

**Workspace** owns imports, companies, leads, campaigns, workflows, activities, audit logs, ICPs, Hermes threads.

**Import:** file metadata, headers, mappings, preview JSON, stats, status (`uploaded` → mapped → confirmed / failed).

**Company:** name (unique per workspace), domain, website, industry, size, geo, socials, metadata JSON.

**Lead:** names, title, email, phone, socials (LinkedIn, WhatsApp, Reddit, X, Instagram, YouTube, TikTok, Google Workspace), website, country, industry, companySize, source, customFields JSON, status, emailValid, phoneValid, optedOut, optional companyId and importId.

**Icp + Qualification:** ICP definition; per-lead score 0–100, status (`qualified` | `maybe` | `unqualified`), reason.

**Campaign:** name, goal, audience JSON, status (`draft` / `running` / paused / `scheduled` / etc.), channels JSON, `sendMode` (`now` | `scheduled`), `sendAt`.

**Workflow + WorkflowVersion:** graph as JSON `nodes` + `edges`. Campaigns attach an active version. Reusable sequences are `Workflow` rows (library).

**WorkflowStep:** ordered chat-authored steps on a version. `editedByUser` protects pasted copy. Optional `videoEnabled`.

**VideoJob:** simulated per-lead video on an email step (`src/lib/video/`).

**CampaignLead:** enrollment: status, currentNodeId, nextExecutionAt. Unique (campaignId, leadId).

**MessageTemplate:** per campaign + nodeId, channel, subject, body.

**Activity:** timeline events; `simulated` boolean.

**Execution:** per campaignLead + nodeId (dedupe completed steps).

**AuditLog:** action / objectType / objectId.

**HermesThread:** Haki AI sessions. title, kind (`campaign` | `sequence`), messages JSON, proposal JSON.

JSON columns are strings parsed with `parseJson` in `src/lib/utils.ts`.

---

## 8. App shell and navigation

`AppFrame` hides the chrome on `/` (landing). Everywhere else: landscape background, rounded “mac window,” optional sidebar, command palette (⌘K).

Sidebar (`src/components/layout/Sidebar.tsx`):

- Logo (traffic lights + **Haki** + “An MK Labs Product”) → `/`
- Nav: Universal (Beta), Overview, Leads, Campaigns, Sequences, Analytics
- **No Hermes item.** `/hermes` redirects to `/sequences`.
- **Haki AI** sits at the **bottom** as a drawer. Click the row to open/close the session list. **+** creates a thread and opens `/haki/{id}`
- Nested session list: open, hover to **rename** or **delete**. Deletes use in-app toasts (`Toaster` in `AppFrame`), not `window.confirm`
- Footer: Simulation mode, Settings

Command palette also has: Open sequence templates, builder, library.

Haki AI is the primary campaign chat. Sequences is the reusable-path desk. Campaigns attach a path and launch.

---

## 9. Landing page (`/`)

`src/components/landing/LandingPage.tsx` plus `smooth-scroll.ts`. There is **no** logo/trust strip.

Shipped sections:

- Hero is one viewport tall (`100svh` minus padding). Pill nav (How it works, Product, Stories, FAQ, Open Haki)
- CTAs: Open Haki AI, See the path. **No** “Peace of mind” copy on the landscape. That overlay is gone.
- Haki AI app preview docks to the bottom of the hero and sits a bit above the fold (`translate-y`) so the top of the desk shows. The rest clips. Sidebar in the fake preview does not include Hermes.
- File strip (CSV / XLSX / JSON): bring a list you already sit in. **Not** “used by these companies.”
- How it works: copy + **full uncropped** walkthrough video `public/haki-walkthrough.webm` (object-contain, wide)
- Problem: accordion (email / LinkedIn / WhatsApp)
- Product desk (`#product`): warm paper stage. Left: click Ingest / Qualify / Workflow / Review. Right: overlapping cards (`ProductDesk`)
- Who it is for; comparison table
- Dark channel strip
- Testimonials masonry (original names/quotes about multi-touch; not Aceternity copy)
- FAQ (scrape, send, files, channels, closing the browser)
- No about closer. Footer is grassland + **Haki** wordmark + “An MK Labs Product” only.

Avoid em dashes in marketing copy.

---

## 10. Haki AI (primary product)

**Routes:** `/haki` empty/new chat. `/haki/[sessionId]` loads that `HermesThread`. Do not fetch `/api/hermes/session` when `sessionId` is missing.

**UI:** `src/components/haki/HakiHome.tsx`

- Split: chat | optional ingest/campaign preview (`IngestPreview`)
- **Desk bar** (always on): **Leads** opens the right table, **Campaign** opens the drafted workflow, **Hide table** closes the pane. Do not rely on chat language alone.
- Preview also opens on “show leads / preview / table” language, or when a campaign is drafted
- After first send on `/haki`, `router.replace(/haki/{threadId})`. Keep the right pane open across that navigation. Persist `showPreview` and `tab` in `haki:workspace-session`
- Empty state: “Who do you want to reach?”, starters from `/api/hermes/starters`
- Chat: user bubbles, assistant markdown, tool chips
- Composer: textarea, Upload file, **mic (Web Speech API, Chrome/Edge)**, **context ring**, send
- Context ring: 64k estimate. Empty session is **0 of 64k**. Counts typed input, chat text, and drafted **message copy** only (`chars/4`). Does not add fake overhead. Does not stringify the whole workflow JSON. Not a billed DeepSeek meter.
- Save draft / open campaign via `/api/campaigns`

**sessionStorage keys:**

| Key | Role |
| --- | --- |
| `haki:seed` | One-shot prompt. Universal **Open in Haki AI** writes it. Haki AI consumes and sends on load. |
| `haki:workspace-session` | Last thread, proposal, `showPreview`, `tab` for the same session id |
| `haki:sequence-seed` | `{ name, workflow }` from a template preview into `/sequences/builder` |

**Sessions API:**

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/hermes/sessions` | List campaign threads |
| POST | `/api/hermes/sessions` | Create “New session” |
| PATCH | `/api/hermes/sessions/[id]` | Rename (keeps title on later chat if not default) |
| DELETE | `/api/hermes/sessions/[id]` | Delete; if active, sidebar sends user to `/haki` |
| DELETE | `/api/hermes/sessions` | Flush **all** campaign threads. Settings testing control. Leads and campaigns stay. |
| GET | `/api/hermes/session?threadId=` | Load messages + proposal |
| POST | `/api/hermes/chat` | Turn: scope + tools + persist thread |

Chat titles: auto-title only if title is empty, `New session`, or `Hermes`. Manual rename is kept.

---

## 11. Hermes AI layer (how chat is built)

`src/lib/hermes/orchestrator.ts` + `scope.ts` + `tools.ts` + `local.ts`

Philosophy: AI recommends; execution validates. Nothing irreversible from a raw completion.

**Scope gate:** decides if the message is about Haki/workspace. Off-topic stays in product.

**Tools (function calling):**

- `get_workspace_context`
- `draft_campaign`
- `draft_multitouch_campaign` (fried-shop demo path: email → wait 24h → follow-up → LinkedIn → X intel → YouTube intel → WhatsApp)
- `draft_sequence`
- `draft_sequence_spec` / `revise_sequence_spec` (ordered steps; compile to graph; keep weekday / send-window checks)
- `revise_campaign`
- `add_workflow_node` / `remove_workflow_node` / `edit_workflow_node`
- `qualify_leads`

Drafts sync to a campaign via `src/lib/campaigns/sync.ts` when a workflow exists. **Never launch from chat.**

If DeepSeek is missing, `local.ts` / `fallback.ts` still produce structured drafts.

Chat replies render through `Markdown.tsx` + `polishChatReply` (`src/lib/hermes/prose.ts`). No raw `**`, pipe tables, or `::` dumps.

`/hermes` redirects to `/sequences`. `HermesStudio` is the chat + canvas used on `/sequences/builder` and `/campaigns/new`. It is not a sidebar destination.

---

## 12. Haki Universal (Beta)

**Route:** `/universal`. Sidebar marked Beta.

Operator writes a sourcing brief. DeepSeek (or local plan) produces a plan (title, audience, geography, columns, thoughts). Then **only**:

- Wikidata SPARQL
- OpenStreetMap Overpass

Stream events: plan, thought, status, hit, done, error (`src/lib/universal/types.ts`).

**UI:** plan pane + `CollectionPreview`. Live hits are a **dense table** (index, company, contact, place, site). Click a row for a **record panel**: every collected field, blanks stay blank. **Open in Haki AI** seeds `/haki` with that record (`haki:seed`). Website is a separate external link. CSV and Import still go to `/leads/import`.

Rules: no invented contact fields; never claim a listing site was scraped. Do not restyle this as pill-heavy “AI cards.”

API: `POST /api/universal` (NDJSON stream).

---

## 13. Ingestion and leads

**Import UI:** `/leads/import` steps Upload → Map → Preview → Import.

**APIs:** `POST /api/imports`, `GET/PATCH` map, `POST .../confirm`.

**Lib:** `parse.ts` (CSV/XLSX/JSON), `map.ts` (column inference), `validate.ts`, `normalize.ts`.

Preview ~100 rows. Mapping is correctable. Confirm normalizes companies + leads, keeps custom fields.

**Leads UI:** `/leads` table, filters, drawer (`LeadDrawer`), social icons, qualify, insight (`/api/leads/[id]/insight`).

**Qualify:** ICP via `/api/icp`, `/api/leads/qualify`, `/api/ai/qualify`. Structured score + status + reason.

**Sample data:** settings or `/api/sample` / dummy campaign. Demo fried-shop contacts when no real file exists. Label dummy clearly.

---

## 14. Campaigns, workflows, messages

**Campaign** = goal + audience + workflow + ordered sequence steps + messages + channels + execution state. `sendMode` (`now` | `scheduled`) and `sendAt` are additive. Scheduled campaigns wait in status `scheduled` until the in-process scheduler sees `sendAt`.

Goals (typed): book meetings, generate replies, start conversations, drive website visits, generate leads, custom. Natural language is allowed; AI maps to strategy.

Audience types (spec + partial code): all, selected ids, qualified, filtered (industry, country, size, title, score, has email/phone/LinkedIn, custom).

**Workflow graph** (XYFlow, node type `haki`):

- Nodes: cards with color bar, icon (`src/components/workflow/look.ts`), type, copy preview. Selected: blue ring.
- Palette: bottom dock grouped Start / Touches / Intel / Logic.
- Inspector: `NodePanel` on the right.
- Canvas: paper field, smoothstep arrows. `zoomOnScroll={false}` and `preventScrolling={false}` so the page can scroll. Zoom is + / − controls.
- Node types: trigger, action, wait, condition, ai_decision (spec; palette is still thin), end.
- Palette actions (`src/lib/workflow/nodes.ts`): email, WhatsApp, Instagram (still wired to `send_linkedin` in that one palette row. Check before changing), LinkedIn message, LinkedIn connect, research X, research YouTube, SMS, wait, condition, stop.

Unavailable real providers: mark coming soon. Never report a fake real send.

Conditions include: opened, replied, clicked, SMS replied, call answered, LinkedIn connected/replied, meeting booked, no response, positive/negative, **`is_weekday`**, **`in_send_window`** (`sendAfterHour` / `sendBeforeHour`).

**Messages:** `{{first_name}}`, `{{company_name}}`, `{{industry}}`, `{{job_title}}`, custom fields. AI generate/rewrite via `/api/ai/message` and `ai.generateMessage` / `rewriteMessage`.

**Campaign pages:**

- `/campaigns` list
- `/campaigns/new` (`HermesStudio` kind campaign)
- `/campaigns/[id]` tabs: Overview, Sequence (`SequenceDesk`), Canvas. Launch now or schedule. Pause. Polls + `/api/tick` every 4s while open.

**Ordered steps:** `WorkflowStep` on the active version. Chat (`draft_sequence_spec` / `revise_sequence_spec` / `POST /api/campaigns/[id]/steps`) is the authoring surface. `editedByUser` protects pasted email copy. Email steps may toggle simulated per-lead `VideoJob`s. Duplicate: `POST .../steps/[stepId]/duplicate`. Video preview: `POST /api/video/preview`.

---

## 15. Sequences (separate pages)

Reusable graphs. Not the same as a running campaign. Not a Hermes nav item.

Shared chrome: `SequenceNav` (Templates · Builder · Library) in the page actions.

| Route | Role |
| --- | --- |
| `/sequences` | Template cards. **Blank sequence** writes a default graph to `haki:sequence-seed` and opens the builder. |
| `/sequences/[id]` | Preview one starter. Path cards + editable canvas. **Open builder** writes `haki:sequence-seed` and goes to `/sequences/builder`. |
| `/sequences/builder` | `HermesStudio` kind sequence. Reads seed, or `?template=first-reply`, or `?blank=1`. Save → `/sequences/library`. |
| `/sequences/library` | Saved `Workflow` rows from `GET /api/workflows`. |

Starter ids in `src/lib/sequence/templates.ts`:

- `first-reply`
- `weekday-window`
- `multi-channel` (Email then LinkedIn)
- `three-touch`
- `whatsapp-close`

Helpers: `getSequenceTemplate`, `cloneWorkflow`, `templateChannels`, `templateSteps`. Seed helpers: `src/lib/sequence/seed.ts`.

Static routes `builder` and `library` win over `[id]`. Do not name a template `builder` or `library`.

`/hermes` → `/sequences`.

---

## 16. Execution and simulation

`instrumentation.ts` starts `startScheduler()` on Node: `processDue` every **4 seconds**.

`src/lib/execution/engine.ts`:

- `launchCampaign` enrolls audience, sets queued + nextExecutionAt
- Walks graph: actions call `getChannel` (`channels.ts`)
- Email channel: Resend when `RESEND_API_KEY` is set; still **simulated** unless `RESEND_SEND_ENABLED=true` and `RESEND_FROM` is set
- Waits set nextExecutionAt
- Conditions: replied / engagement plus `is_weekday` and `in_send_window`
- Fake open / reply / meeting rates only when the channel result is `simulated`
- Intel steps: `gatherTwitterIntel`, `gatherYoutubeIntel` (simulated public context)
- Skip send if required contact field missing
- Activity `simulated` follows the channel result. Never label a live Resend send as simulation, and never invent a real send when sends are off.

`/api/tick` can process due work. `/api/campaigns/[id]/launch` and `/pause`.

**Campaign lead states (spec):** queued, active, waiting, paused, completed, failed, stopped, interested, not interested.

Browser close: scheduler is **in-process with the Next server**, not a separate worker. If `next dev` / the Node process is down, nothing ticks. Product spec wants execution independent of the **browser**; it is not yet a standalone worker/queue.

---

## 17. Activity, journey, analytics

`recordActivity` in `src/lib/activity.ts`. Timeline on overview, lead drawer, campaign.

Analytics (`/analytics`, `/api/analytics`): contacted, sent, opens, replies, positive replies, meetings, conversion. Breakdowns intended: campaign, channel, step, industry, size. Keep simple.

Overview: `/overview`, `/api/overview`.

---

## 18. API inventory

All should return the `{ success, data }` / `jsonError` shape.

| Area | Paths |
| --- | --- |
| AI | `/api/ai/qualify`, `/api/ai/workflow`, `/api/ai/message` |
| Campaigns | CRUD, `/launch`, `/pause`, `/dummy`, `/[id]/steps`, `/[id]/steps/[stepId]`, `/[id]/steps/[stepId]/duplicate` |
| Video | `/api/video/preview` |
| Leads | list, get, qualify, insight |
| Workflows | `/api/workflows` (sequence library) |
| Hermes | sessions, session, chat, starters |
| Universal | `POST /api/universal` (NDJSON) |
| Settings | `GET /api/settings` includes `aiConfigured` and `email` (`checkResend()`). Never returns the raw key. |
| Other | imports + map + confirm, ICP, activities, sample, tick, touchpoints, overview, analytics |

---

## 19. Security and compliance posture (current)

- No end-user auth, no RBAC, no org switching.
- DeepSeek and Resend keys server-side only. Settings shows DeepSeek status and a Resend domains check (key accepted, send off/on, from, domains). Never show the raw key.
- Universal refuses criminal / medical / credential-theft briefs in the planner prompt.
- Simulation banner in the sidebar until live send is explicitly enabled.
- Do not add client-side API keys. Do not commit `.env`. Keys pasted in chat should be rotated if the thread is shared.

---

## 20. Feature status (honest)

Treat this table as source of truth when suggesting work. “Spec” means CLAUDE / product intent; “Shipped” means UI + server path exists in some form.

| Area | Status | Notes |
| --- | --- | --- |
| Landing + MK Labs | Shipped | Viewport hero + app preview, product desk, video, stories, FAQ. No peace-of-mind overlay. |
| Haki AI chat + sessions | Shipped | Drawer sessions, desk bar, voice, context ring (empty = 0), flush-all |
| Ingest CSV/XLSX | Shipped | JSON accepted in parser |
| Lead table + drawer | Shipped | |
| ICP qualify | Shipped | AI + fallback |
| Campaign draft from chat | Shipped | Sequence spec + graph compile. Review first |
| Chat sequence editor | Shipped | Ordered steps, per-step paste, editedByUser, launch now/schedule |
| Per-lead AI video | Shipped (sim) | Email toggle. Mock news + DeepSeek script + mock renderer |
| Sequence templates | Shipped | Separate pages: templates, preview, builder, library |
| Visual workflow | Shipped | Card nodes, grouped palette, inspector. Wheel does not zoom. |
| Simulation engine + scheduler | Shipped | In-process; fake engagement only when simulated |
| Resend email | Wired, sends off | Key check + domain on Settings. Live send needs `RESEND_SEND_ENABLED=true` |
| Real SMS/LinkedIn providers | Not shipped | Simulation adapters |
| Independent worker / queue | Not shipped | Dies with the Node process |
| Auth / multi-user | Not shipped | One workspace |
| Reply inbox / real classification loop | Partial | `ai.classifyReply` exists; not a full mailbox |
| AI decision node in canvas | Spec / thin | Prompted in generateWorkflow |
| Universal open data | Shipped Beta | Wikidata + Overpass. Table + record panel + Haki AI seed |
| Lead scraping | Forbidden | |
| CRM / API ingest | Spec later | File upload first |
| Instagram/YouTube as real send | Simulated intel or palette only | Never fake a send |

---

## 21. Copy and UX conventions

- Operator language. Short sentences. Periods and colons, not em dashes.
- Simulation always labeled.
- Dummy/sample data labeled.
- Universal always Beta.
- Context ring estimates tokens from real text only. Empty composer is 0. It is not a billed DeepSeek meter.
- Voice uses the browser Speech Recognition API; unsupported browsers disable the mic.
- Landing Haki mark and app sidebar both say MK Labs.
- Sequences: one concern per page. Do not stack templates and builder on one scroll again.

---

## 22. How to run locally

1. `npm install`
2. `.env` with `DATABASE_URL`, optional DeepSeek vars, optional Resend vars (`RESEND_SEND_ENABLED=false` unless you intend live mail)
3. `npx prisma db push` (or rely on first boot if already pushed)
4. `npm run dev`
5. Landing `/`, product `/haki`, sequences `/sequences`

`getWorkspace()` seeds dummy data via `ensureDummyData` so empty installs still have something to preview.

Restart `next dev` after changing env so Resend / DeepSeek status updates.

---

## 23. How to use this brief for improvement suggestions

When asked to improve Haki, prefer:

1. Gaps in the status table that match the mental model (review-first OS, not more blast features).
2. Honesty: simulation, open-data-only Universal, no fake logos, no invented phones.
3. Execution reliability (scheduler vs browser vs process).
4. Auth and workspace isolation before calling it multi-tenant.
5. Channel adapters that stay dark until a provider exists.
6. Session UX, ingest UX, sequence pages, landing clarity.
7. Do not suggest scraping or “just add Apollo.”
8. Do not suggest auto-launch from the model.
9. Do not put Hermes back in the sidebar.

Good suggestion shape: problem, why it matters for the OS metaphor, smallest change, what not to break.

---

## 24. Final product principle (repeat)

The product is:

```
DATA → AI → WORKFLOW → MULTI CHANNEL OUTREACH → CONVERSATION → OUTCOME
```

Not:

```
CSV → Email campaign
```

Haki is an MK Labs Product.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
