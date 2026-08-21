"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { scrollToId, useLandingSmoothScroll } from "./smooth-scroll";
import { TrustStrip } from "./TrustStrip";

const ROWS = [
  ["Pilon Fry House", "Sofia Mendez", "casa@pilonfryhouse.demo", "Qualified"],
  ["Saltine Fry", "Eli Hart", "hello@saltinefry.demo", "Maybe"],
  ["Bird & Basket", "June Cole", "june@birdandbasket.demo", "Qualified"],
  ["Crisp & Co", "Marcus Bell", "hello@crispandco.demo", "Maybe"],
  ["Gold Batter", "Priya Shah", "priya@goldbatter.demo", "Qualified"],
];

const STEPS = [
  { n: "01", title: "Upload", body: "Bring a CSV or XLSX you already have. Haki does not scrape leads." },
  { n: "02", title: "Preview", body: "See the first 100 rows. Map fields. Confirm what gets imported." },
  { n: "03", title: "Ask Haki", body: "Say who to reach and what you want. Hermes drafts the workflow." },
  { n: "04", title: "Review", body: "Nothing sends until you approve. Simulation first, providers later." },
];

const PILLARS = [
  {
    title: "You bring the list",
    body: "Haki starts after sourcing. Upload the file, see what mapped, and keep custom fields intact.",
  },
  {
    title: "Haki drafts the path",
    body: "One workflow across email, LinkedIn, WhatsApp, SMS, and more. It waits, branches, and stops on a reply.",
  },
  {
    title: "You get what you asked for",
    body: "Describe the goal. Review the plan. Launch when it is right. The campaign keeps running after you close the tab.",
  },
];

const FLOW = ["Data", "Leads", "AI", "Goal", "Workflow", "Outreach", "Conversations", "Outcomes"];

const CHANNELS = [
  { name: "Email", note: "First touch and follow-up" },
  { name: "LinkedIn", note: "Connect, then message" },
  { name: "WhatsApp", note: "Short personalized close" },
  { name: "X", note: "Public context before you write" },
  { name: "YouTube", note: "Simulated sapien / intel" },
  { name: "SMS", note: "When email stays quiet" },
  { name: "Phone", note: "Booked when the path asks" },
];

const PAINS = [
  { title: "Email in one tab", body: "The first touch goes out. The follow-up lives in a calendar reminder you ignore by Thursday." },
  { title: "LinkedIn in another", body: "Someone was supposed to connect after 24 hours. Nobody owns that step, so it does not happen." },
  { title: "WhatsApp as an afterthought", body: "The close sits in a notes app. The lead already went cold." },
];

const FEATURES = [
  {
    kicker: "Ingest",
    title: "Import the file. Keep the truth in the row.",
    body: "CSV or XLSX first. Haki detects columns, guesses the map, and shows the first 100 rows. Missing emails stay missing. Unknown fields stay on the lead. You correct the map before anything is stored.",
    points: ["Preview, do not dump 10,000 rows on the screen", "Company and contact stay separate", "Custom fields are not discarded"],
  },
  {
    kicker: "Qualify",
    title: "Score the list against who you actually want.",
    body: "Write the ICP the way you already think about it: industry, size, country, title. Each lead comes back with a score, a status, and a reason you can read. You pick who enters the campaign.",
    points: ["Structured result, not a vibe", "Qualified, maybe, or leave them out", "You still decide the audience"],
  },
  {
    kicker: "Workflow",
    title: "One path. Several channels. A stop when they answer.",
    body: "This is not an email sequence with extras taped on. Trigger, action, wait, condition, next action. If they reply, the campaign stops. If they do not, the next channel can fire. You edit the graph before it is live.",
    points: ["Email, LinkedIn, WhatsApp, SMS, phone, X", "Waits and branches you can see", "AI can draft. It cannot launch."],
  },
  {
    kicker: "Review",
    title: "Read the messages. Then let it run without the laptop open.",
    body: "Personalize with first name, company, title, and your own fields. Generate or rewrite if you want. Simulation labels every send until a provider is connected. After launch, each lead keeps a step, a status, and a next time.",
    points: ["Nothing pretends to be a real send", "The campaign is resumable", "Journey and analytics stay readable"],
  },
];

const AUDIENCE = [
  {
    title: "Operators with a list already",
    body: "You bought the file, exported the CRM, or pulled it from Hermes. You need a campaign, not another database.",
  },
  {
    title: "Agencies running client outreach",
    body: "One workspace per list. Preview, map, review, then show the client the path before a single touch goes out.",
  },
  {
    title: "Founders who want meetings",
    body: "Say the goal in a sentence. Edit the draft. Watch replies and booked calls without living in five tools.",
  },
];

const COMPARE = [
  { old: "Spreadsheet plus Gmail plus a LinkedIn tab", next: "One campaign with every channel on the same path" },
  { old: "A Notion checklist for follow-ups", next: "Wait nodes and conditions that actually branch" },
  { old: "A blast, then hope", next: "Preview, qualify, review, then simulate or send" },
  { old: "AI that fires the moment it drafts", next: "AI that proposes. You approve." },
];

const FAQS = [
  {
    q: "Does Haki find or scrape leads?",
    a: "No. Haki starts when you upload a dataset you already have. Universal (Beta) can pull from Wikidata and OpenStreetMap only. It does not scrape listing sites, LinkedIn, or people databases, and it does not invent emails or phones.",
  },
  {
    q: "Will it send messages the moment I ask?",
    a: "No. Hermes can draft a workflow and messages. You review them. Until a provider is connected, actions run in simulation and are labeled as such.",
  },
  {
    q: "What files can I upload?",
    a: "CSV and XLSX first. JSON is accepted. Haki does not care whether the file came from a CRM, Hermes, or a colleague. The lead model stays the same.",
  },
  {
    q: "What channels can a campaign use?",
    a: "Email, LinkedIn, WhatsApp, X, SMS, and phone are first-class in the workflow. Instagram and YouTube are marked clearly when they are not ready. Unavailable channels never report a fake send.",
  },
  {
    q: "What happens if I close the browser?",
    a: "Execution is meant to continue without the tab open. Each enrolled lead keeps its current step, status, and next run time so the campaign can resume.",
  },
];

const NAV = ["Haki AI", "Universal", "Overview", "Hermes", "Leads", "Campaigns", "Sequences", "Analytics"];

const TESTIMONIALS = [
  {
    name: "Nia Okonkwo",
    handle: "niaokonkwo",
    text: "We used to fire email, then remember LinkedIn three days later. Haki keeps the whole path in one workflow: email, wait, connect, WhatsApp, and it stops when they reply.",
  },
  {
    name: "Theo Marlow",
    handle: "theomarlow",
    text: "Upload the list. Map the fields. Ask for a 7-touch campaign. Review. That sequence replaced our Friday scramble.",
  },
  {
    name: "Amara Voss",
    handle: "amaravoss",
    text: "This is an outreach OS, not another blast tool. 🔥",
  },
  {
    name: "Jonas Hale",
    handle: "jonashale",
    text: "Hermes drafted Email → wait 24h → LinkedIn → SMS without me drawing boxes for an hour. I still had to approve every step. That’s the point.",
  },
  {
    name: "Priya Raman",
    handle: "priyaraman",
    text: "ICP scoring on the same file we already had. No scraping. No invented phones. Missing fields stayed empty and we filled what we could.",
  },
  {
    name: "Leo Hart",
    handle: "leohartops",
    text: "The journey view is what I show the team. Imported → qualified → email sent → opened → LinkedIn → reply classified. You always know what happens next.",
  },
  {
    name: "Sofia Reyes",
    handle: "sofiareyes",
    text: "Simulation mode saved us. We ran the whole campaign before a provider was connected and nothing pretended to be a real send.",
  },
  {
    name: "Malik Trent",
    handle: "maliktrent",
    text: "Booked three discovery calls from a list that had been sitting in a spreadsheet. Multi-touch, not a one-shot email.",
  },
  {
    name: "Elena Cho",
    handle: "elenacho",
    text: "Personalization tokens across channels finally match. First name in email, company on LinkedIn, short close on WhatsApp. Same lead, same campaign.",
  },
  {
    name: "Owen Blake",
    handle: "owenblake",
    text: "Looks like the operating layer we needed. 🙌",
  },
  {
    name: "Yara Mensah",
    handle: "yaramensah",
    text: "Conditions are the quiet hero. Opened? Replied? No response? The path branches. We stopped writing “if they don’t reply, ping them on LinkedIn” in a Notion doc.",
  },
  {
    name: "Chris Adel",
    handle: "chrisadel",
    text: "I described the goal in a sentence: reach SaaS founders and book calls. I got a strategy I could edit. Nothing launched until I said so.",
    link: { href: "/haki", label: "Open Haki AI" },
  },
  {
    name: "Hana Idris",
    handle: "hanaidris",
    text: "Companies and contacts stay separate. One shop, three owners. The workflow talks to people, not a row that forgot who is who.",
  },
  {
    name: "Mateo Ruiz",
    handle: "mateoruiz",
    text: "Analytics stay simple: contacted, sent, replies, positive replies, meetings. Broken down by channel and step. Actionable, not a vanity dashboard.",
  },
  {
    name: "Ivy Lang",
    handle: "ivylang",
    text: "Email is one channel. That’s the line I repeat now. ✨",
  },
  {
    name: "Ravi Kapoor",
    handle: "ravikapoor",
    text: "Campaigns keep running if I close the laptop. Each lead has a step, a status, and a next time. Resumable. That’s infrastructure.",
  },
  {
    name: "Nora Quinn",
    handle: "noraquinn",
    text: "We mapped CSV columns in minutes, previewed the first hundred rows, and imported without dumping custom fields. Unknown columns survived.",
    tags: ["#workflow", "#multichannel", "#reviewfirst"],
  },
  {
    name: "Samir Costa",
    handle: "samircosta",
    text: "Positive reply → stop. Negative → stop. Meeting booked → stop. The campaign doesn’t keep poking after the outcome. Finally.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingPage() {
  useLandingSmoothScroll();

  return (
    <div className="bg-[#f4f4f2] text-ink">
      <div className="p-3">
        <div
          className="relative min-h-[92vh] overflow-hidden rounded-[28px] bg-cover bg-top"
          style={{ backgroundImage: "url(/haki-landscape.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/25 via-transparent to-black/30" />

          <header className="relative z-10 flex justify-center px-6 pt-5">
            <nav className="flex items-center gap-5 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
              <Link href="/" className="flex items-center gap-2 pl-1 pr-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-[11px] text-white">
                  H
                </span>
                <span className="leading-tight">
                  <span className="block text-[14px] font-semibold tracking-[-0.03em]">Haki</span>
                  <span className="block text-[9px] font-normal tracking-[0.04em] text-muted">An MK Labs Product</span>
                </span>
              </Link>
              <button type="button" onClick={() => scrollToId("how")} className="text-[13px] text-muted hover:text-ink">
                How it works
              </button>
              <button type="button" onClick={() => scrollToId("product")} className="text-[13px] text-muted hover:text-ink">
                Product
              </button>
              <button type="button" onClick={() => scrollToId("stories")} className="text-[13px] text-muted hover:text-ink">
                Stories
              </button>
              <button type="button" onClick={() => scrollToId("faq")} className="text-[13px] text-muted hover:text-ink">
                FAQ
              </button>
              <Link
                href="/haki"
                className="rounded-full bg-[#1d1d1f] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-black"
              >
                Open Haki
              </Link>
            </nav>
          </header>

          <section className="relative z-10 mx-auto max-w-3xl px-6 pb-10 pt-24 text-center sm:pt-32">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="text-[13px] text-[#1d1d1f]/70"
            >
              An outreach operating system for lists you already have
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.08 }}
              className="mt-4 text-[40px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[56px]"
            >
              Turn a file into{" "}
              <em className="font-serif font-normal italic">multi-channel outreach</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.16 }}
              className="mx-auto mt-5 max-w-lg text-[16px] leading-7 text-[#1d1d1f]/65"
            >
              Stop blasting a spreadsheet. Describe the goal. Haki drafts the workflow and waits for your review.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.24 }}
            >
              <Link
                href="/haki"
                className="mt-7 inline-flex rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"
              >
                Open Haki AI
              </Link>
            </motion.div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.28 }}
            className="relative z-10 px-3 pt-10 sm:px-8 sm:pt-16"
          >
            <Link
              href="/haki"
              className="block overflow-hidden rounded-t-[16px] border border-white/70 bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.2)]"
            >
              <HakiAppPreview />
            </Link>
          </motion.div>
        </div>
      </div>

      <TrustStrip />

      <Reveal id="how" className="mx-auto w-full max-w-[1600px] px-4 py-28 sm:px-6">
        <p className="text-center text-[13px] text-muted">How Haki works</p>
        <h2 className="mt-3 text-center text-[36px] font-semibold tracking-[-0.03em] sm:text-[44px]">
          From the file to the first reply
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[16px] leading-7 text-muted">
          You already did the hard part: you have the list. Haki takes the rest. It qualifies, sequences, and runs a
          multi-touch campaign so the work leads to the conversations you actually want.
        </p>

        <div className="relative mx-auto mt-12 w-full max-w-none">
          <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-gradient-to-b from-white/80 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-[#111] shadow-[0_28px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#1c1c1e] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[11px] text-white/50">Haki · campaign walkthrough</span>
            </div>
            <video
              className="block h-auto w-full bg-black object-contain"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Haki product walkthrough"
            >
              <source src="/haki-walkthrough.webm" type="video/webm" />
            </video>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.06} className="rounded-[18px] border border-line bg-white p-5">
              <div className="text-[12px] text-faint">0{index + 1}</div>
              <div className="mt-2 text-[16px] font-medium">{pillar.title}</div>
              <p className="mt-2 text-[13px] leading-6 text-muted">{pillar.body}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 0.06} className="rounded-[18px] border border-line bg-white p-5">
              <div className="text-[12px] text-faint">{step.n}</div>
              <div className="mt-2 text-[16px] font-medium">{step.title}</div>
              <p className="mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <section className="border-y border-line bg-white/60 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-[13px] text-muted">The usual week</p>
          <h2 className="mt-2 max-w-2xl text-[32px] font-semibold tracking-[-0.03em] sm:text-[36px]">
            The list is ready. The follow-up is not.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted">
            Most teams do not fail at finding a file. They fail at keeping the next touch honest across tools. Haki is
            built for that gap.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {PAINS.map((pain) => (
              <div key={pain.title} className="rounded-[18px] border border-line bg-[#f4f4f2] p-5">
                <div className="text-[16px] font-medium">{pain.title}</div>
                <p className="mt-2 text-[13px] leading-6 text-muted">{pain.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Reveal id="product" className="mx-auto max-w-5xl px-6 py-28">
        <p className="text-[13px] text-muted">Product</p>
        <h2 className="mt-2 max-w-2xl text-[32px] font-semibold tracking-[-0.03em] sm:text-[36px]">
          Built like an outreach desk, not a newsletter tool
        </h2>
        <div className="mt-16 space-y-20">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.kicker}
              className={`grid items-center gap-10 lg:grid-cols-2 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] text-faint">{feature.kicker}</div>
                <h3 className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">{feature.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-muted">{feature.body}</p>
                <ul className="mt-5 space-y-2">
                  {feature.points.map((point) => (
                    <li key={point} className="flex gap-2 text-[14px] leading-6 text-ink">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d1d1f]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <FeaturePanel index={index} />
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em]">Who this is for</h2>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted">
          If you still need a database of strangers, you are earlier than Haki. If you already have names and a goal,
          this is the desk.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {AUDIENCE.map((item) => (
            <div key={item.title} className="rounded-[18px] border border-line bg-white p-5">
              <div className="text-[16px] font-medium">{item.title}</div>
              <p className="mt-2 text-[13px] leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em]">What you put down</h2>
        <div className="mt-8 overflow-hidden rounded-[20px] border border-line bg-white">
          <div className="grid grid-cols-2 border-b border-line bg-[#f7f7f8] text-[12px] font-medium uppercase tracking-[0.1em] text-faint">
            <div className="px-5 py-3">The pile of tools</div>
            <div className="border-l border-line px-5 py-3">On Haki</div>
          </div>
          {COMPARE.map((row) => (
            <div key={row.old} className="grid grid-cols-2 border-b border-line last:border-0 text-[14px] leading-6">
              <div className="px-5 py-4 text-muted">{row.old}</div>
              <div className="border-l border-line px-5 py-4">{row.next}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center text-[32px] font-semibold tracking-[-0.03em]">The operating system, not the blast</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-7 text-muted">
          Email is one channel. Haki is the path from a file you already have to a conversation you can review.
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {FLOW.map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium">{item}</span>
              {index < FLOW.length - 1 ? <span className="text-[12px] text-faint">→</span> : null}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-5xl px-6 pb-28">
        <h2 className="text-center text-[32px] font-semibold tracking-[-0.03em]">One workflow. Every channel.</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel, index) => (
            <Reveal key={channel.name} delay={index * 0.05} className="rounded-[18px] border border-line bg-white px-4 py-4">
              <div className="text-[15px] font-medium">{channel.name}</div>
              <p className="mt-1 text-[13px] leading-5 text-muted">{channel.note}</p>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <Reveal id="stories" className="mx-auto max-w-7xl px-6 pb-28">
        <h2 className="text-center text-[36px] font-semibold tracking-[-0.03em]">Loved by operators who run the path</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-7 text-muted">
          What teams say after they stop blasting a CSV and start reviewing multi-touch campaigns.
        </p>
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-5">
          {TESTIMONIALS.map((item) => (
            <article key={item.handle} className="mb-4 break-inside-avoid rounded-xl border border-line bg-white p-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(item.name)}`}
                  alt=""
                  className="h-9 w-9 rounded-full bg-[#f2f2f7]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-[14px] font-semibold tracking-[-0.02em]">{item.name}</span>
                    <VerifiedBadge />
                  </div>
                  <div className="truncate text-[13px] text-muted">@{item.handle}</div>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-[#3a3a3c]">{item.text}</p>
              {"link" in item && item.link ? (
                <Link href={item.link.href} className="mt-2 inline-block text-[13px] text-[#1d9bf0] hover:underline">
                  {item.link.label}
                </Link>
              ) : null}
              {"tags" in item && item.tags ? (
                <p className="mt-2 text-[13px] leading-5 text-[#1d9bf0]">{item.tags.join(" ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal id="faq" className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em]">Questions people ask first</h2>
        <div className="mt-8 divide-y divide-line rounded-[20px] border border-line bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-[15px] font-medium tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-[18px] text-faint group-open:hidden">+</span>
                  <span className="hidden text-[18px] text-faint group-open:inline">−</span>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal id="about" className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="font-serif text-[40px] italic tracking-[-0.03em]">Peace of mind before anything sends</h2>
        <p className="mt-5 text-[16px] leading-8 text-muted">
          Haki starts with a file you already have. It qualifies, sequences, and runs outreach in simulation until you
          connect a provider. You always review first, then the work runs toward the outcome you named.
        </p>
        <Link
          href="/haki"
          className="mt-8 inline-flex rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"
        >
          Open Haki AI
        </Link>
      </Reveal>

      <div className="px-3 pb-3">
        <footer
          className="relative min-h-[88vh] overflow-hidden rounded-[28px] bg-cover bg-bottom"
          style={{ backgroundImage: "url(/haki-grassland.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#f4f4f2]/40 via-transparent to-black/25" />
          <div className="relative z-10 flex min-h-[88vh] flex-col">
            <div className="flex flex-1 flex-col items-center justify-end px-6 pb-[22vh] pt-[34vh]">
              <p className="font-serif text-[22vw] leading-none tracking-[-0.04em] text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.28)] sm:text-[18vw]">
                Haki
              </p>
              <p className="mt-3 text-[13px] tracking-[0.18em] text-white/80 uppercase">An MK Labs Product</p>
            </div>
            <div className="flex flex-col items-center gap-3 px-6 pb-8 text-center text-white/90 sm:flex-row sm:justify-between">
              <span className="text-[13px] font-medium">Haki · MK Labs</span>
              <div className="flex gap-5 text-[13px]">
                <Link href="/haki" className="hover:text-white">
                  Haki AI
                </Link>
                <button type="button" onClick={() => scrollToId("how")} className="hover:text-white">
                  How it works
                </button>
                <button type="button" onClick={() => scrollToId("product")} className="hover:text-white">
                  Product
                </button>
                <button type="button" onClick={() => scrollToId("faq")} className="hover:text-white">
                  FAQ
                </button>
              </div>
              <span className="text-[12px] text-white/70">Simulation workspace · Nothing is sent for real</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeaturePanel({ index }: { index: number }) {
  const panels = [
    <div key="ingest" className="rounded-[20px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.12em] text-faint">File preview</div>
      <div className="mt-3 space-y-2 text-[13px]">
        <div className="flex justify-between rounded-[10px] bg-[#f7f7f8] px-3 py-2">
          <span>18 rows · 9 columns</span>
          <span className="text-good">Mapped</span>
        </div>
        <div className="flex justify-between rounded-[10px] px-3 py-2">
          <span className="text-muted">email</span>
          <span>Email</span>
        </div>
        <div className="flex justify-between rounded-[10px] px-3 py-2">
          <span className="text-muted">owner_name</span>
          <span>Contact</span>
        </div>
        <div className="flex justify-between rounded-[10px] px-3 py-2">
          <span className="text-muted">notes</span>
          <span>Custom field</span>
        </div>
      </div>
    </div>,
    <div key="qualify" className="rounded-[20px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.12em] text-faint">ICP match</div>
      <div className="mt-4 text-[40px] font-semibold tracking-[-0.04em]">87</div>
      <div className="text-[13px] text-good">Qualified</div>
      <p className="mt-3 text-[13px] leading-6 text-muted">
        SaaS, 50 to 500 people, United States, founder title. The contact sits inside the band you wrote.
      </p>
    </div>,
    <div key="flow" className="rounded-[20px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.12em] text-faint">Path</div>
      <div className="mt-4 space-y-3 text-[13px]">
        {["Lead enters", "Email", "Wait 24 hours", "Replied? Stop", "LinkedIn, then WhatsApp"].map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f2f2f7] text-[11px]">{i + 1}</span>
            {step}
          </div>
        ))}
      </div>
    </div>,
    <div key="review" className="rounded-[20px] border border-line bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.12em] text-faint">Lead state</div>
      <div className="mt-4 space-y-2 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted">Step</span>
          <span>LinkedIn message</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Status</span>
          <span>Waiting</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Next run</span>
          <span>Tomorrow, 09:40</span>
        </div>
        <div className="mt-3 rounded-[10px] bg-[#e8e8ff] px-3 py-2 text-[12px] text-[#5856d6]">Simulated until a provider is connected</div>
      </div>
    </div>,
  ];

  return panels[index] ?? panels[0];
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#1d9bf0]" aria-label="Verified" role="img">
      <path
        fill="currentColor"
        d="M22.5 12.5c0-1.2-.7-2.3-1.8-2.8.2-1.2-.2-2.5-1.2-3.3-1-.8-2.4-.9-3.5-.3-.8-1-2.1-1.6-3.5-1.6s-2.7.6-3.5 1.6c-1.1-.6-2.5-.5-3.5.3-1 .8-1.4 2.1-1.2 3.3-1.1.5-1.8 1.6-1.8 2.8s.7 2.3 1.8 2.8c-.2 1.2.2 2.5 1.2 3.3.6.5 1.3.7 2.1.7.5 0 1-.1 1.4-.4.8 1 2.1 1.6 3.5 1.6s2.7-.6 3.5-1.6c.4.3.9.4 1.4.4.8 0 1.5-.2 2.1-.7 1-.8 1.4-2.1 1.2-3.3 1.1-.5 1.8-1.6 1.8-2.8zm-12.2 2.6-2.8-2.8 1.1-1.1 1.7 1.7 4.2-4.2 1.1 1.1-5.3 5.3z"
      />
    </svg>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const Tag = id ? motion.section : motion.div;
  return (
    <Tag
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </Tag>
  );
}

function HakiAppPreview() {
  return (
    <div className="pointer-events-none flex h-[420px] overflow-hidden sm:h-[520px]">
      <aside className="hidden w-[168px] shrink-0 flex-col bg-[#f6f6f8] sm:flex">
        <div className="flex h-11 items-center gap-2 px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-1 text-[12px] font-semibold">Haki</span>
        </div>
        <div className="space-y-0.5 px-2 pt-1 text-[12px]">
          {NAV.map((item) => (
            <div
              key={item}
              className={`rounded-[8px] px-2.5 py-1.5 ${item === "Haki AI" ? "bg-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted"}`}
            >
              {item}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 items-center justify-between border-b border-line px-4">
          <div>
            <div className="text-[13px] font-semibold">Haki AI</div>
            <div className="text-[11px] text-muted">Chat first. Preview the file when you ask.</div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-7 w-36 rounded-[8px] bg-[#f2f2f7] text-[11px] leading-7 text-faint">Search ⌘K</div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e8e8ed] text-[9px] font-semibold">
              HK
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-[38%] min-w-[220px] flex-col border-r border-line p-4">
            <div className="mb-3 flex justify-end">
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white">Save draft</span>
            </div>
            <div className="mb-3 flex justify-end">
              <div className="max-w-[90%] rounded-[16px] bg-accent px-3 py-2 text-[11px] leading-4 text-white">
                Show me a preview of the ingested leads.
              </div>
            </div>
            <div className="space-y-2 text-[11px] leading-5 text-ink">
              <p className="font-medium">Here’s your campaign preview: “Fried Shop Owner Outreach”.</p>
              <p className="text-muted">
                Goal: start conversations. Email → wait 24h → follow-up → LinkedIn → Twitter → YouTube sapien → WhatsApp.
              </p>
              <div className="flex gap-1">
                <span className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[10px] text-muted">Read workspace</span>
                <span className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[10px] text-muted">Drafted multi-touch</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 bg-[#f7f7f8] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-semibold">Preview</div>
                <div className="text-[10px] text-faint">18 rows · first 100 from the ingested file</div>
              </div>
              <span className="text-[11px] text-accent">Open table</span>
            </div>
            <div className="mb-2 flex w-fit rounded-[8px] bg-white p-0.5 text-[11px]">
              <span className="rounded-[6px] bg-[#f2f2f7] px-2.5 py-1 font-medium">File</span>
              <span className="px-2.5 py-1 text-muted">Campaign</span>
            </div>
            <div className="overflow-hidden rounded-[10px] border border-line bg-white">
              <table className="w-full table-fixed text-left text-[11px]">
                <thead className="text-[9px] uppercase tracking-[0.12em] text-faint">
                  <tr className="border-b border-line">
                    <th className="px-3 py-2 font-medium">Business</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([business, , email, status]) => (
                    <tr key={business} className="border-b border-line last:border-0">
                      <td className="truncate px-3 py-2 font-medium">{business}</td>
                      <td className="truncate px-3 py-2 text-muted">{email}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${status === "Qualified" ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
