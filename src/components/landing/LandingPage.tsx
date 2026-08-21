"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { scrollToId, useLandingSmoothScroll } from "./smooth-scroll";

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
  { n: "03", title: "Ask Haki", body: "Say who to reach and what you want. Haki drafts the workflow." },
  { n: "04", title: "Review", body: "Nothing sends until you approve. Simulation first. Providers later." },
];

const FLOW = ["Data", "Leads", "AI", "Goal", "Workflow", "Outreach", "Conversations", "Outcomes"];

const CHANNELS = [
  { name: "Email", note: "First touch and follow-up" },
  { name: "LinkedIn", note: "Connect, then message" },
  { name: "WhatsApp", note: "Short personalized close" },
  { name: "X", note: "Public context before you write" },
  { name: "SMS", note: "When email stays quiet" },
  { name: "Phone", note: "Booked when the path asks" },
];

const PAINS = [
  {
    title: "Email in one tab",
    body: "The first touch goes out. The follow-up lives in a calendar reminder you ignore by Thursday.",
  },
  {
    title: "LinkedIn in another",
    body: "Someone was supposed to connect after 24 hours. Nobody owns that step, so it does not happen.",
  },
  {
    title: "WhatsApp as an afterthought",
    body: "The close sits in a notes app. The lead already went cold.",
  },
];

const FEATURES = [
  {
    kicker: "Ingest",
    title: "Import the file. Keep the truth in the row.",
    body: "CSV or XLSX first. Haki detects columns, guesses the map, and shows the first 100 rows. Missing emails stay missing. Unknown fields stay on the lead. You correct the map before anything is stored.",
    points: ["Preview. Do not dump 10,000 rows on the screen.", "Company and contact stay separate.", "Custom fields are not discarded."],
  },
  {
    kicker: "Qualify",
    title: "Score the list against who you actually want.",
    body: "Write the ICP the way you already think about it: industry, size, country, title. Each lead comes back with a score, a status, and a reason you can read. You pick who enters the campaign.",
    points: ["Structured result, not a vibe.", "Qualified, maybe, or leave them out.", "You still decide the audience."],
  },
  {
    kicker: "Workflow",
    title: "One path. Several channels. A stop when they answer.",
    body: "This is not an email sequence with extras taped on. Trigger, action, wait, condition, next action. If they reply, the campaign stops. If they do not, the next channel can fire. You edit the graph before it is live.",
    points: ["Email, LinkedIn, WhatsApp, SMS, phone, X.", "Waits and branches you can see.", "AI can draft. It cannot launch."],
  },
  {
    kicker: "Review",
    title: "Read the messages. Then let it run without the laptop open.",
    body: "Personalize with first name, company, title, and your own fields. Generate or rewrite if you want. Simulation labels every send until a provider is connected. After launch, each lead keeps a step, a status, and a next time.",
    points: ["Nothing pretends to be a real send.", "The campaign is resumable.", "Journey and analytics stay readable."],
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
    a: "No. Haki can draft a workflow and messages. You review them. Until a provider is connected, actions run in simulation and are labeled as such.",
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
    a: "Execution is meant to continue without the tab open. Each enrolled lead keeps its current step, status, and next run time so the campaign can resume. Today the scheduler lives with the Next server. If that process is down, nothing ticks.",
  },
];

const NAV = ["Haki AI", "Universal", "Overview", "Leads", "Campaigns", "Sequences", "Analytics"];

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
    text: "Conditions are the quiet hero. Opened? Replied? No response? The path branches. We stopped writing follow-up rules in a Notion doc.",
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
    <div className="bg-[#f7f7f4] text-ink">
      <div className="p-3">
        <div
          className="relative flex h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[20px] bg-cover bg-top"
          style={{ backgroundImage: "url(/haki-landscape.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/35" />

          <header className="relative z-10 flex justify-center px-5 pt-5">
            <nav className="flex items-center gap-6 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 backdrop-blur-xl">
              <Link href="/" className="flex items-center gap-2 pr-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-[11px] text-white">
                  H
                </span>
                <span className="leading-tight">
                  <span className="block text-[14px] font-semibold tracking-[-0.03em]">Haki</span>
                  <span className="block text-[9px] font-normal tracking-[0.04em] text-muted">An MK Labs Product</span>
                </span>
              </Link>
              <button type="button" onClick={() => scrollToId("how")} className="hidden text-[13px] text-muted hover:text-ink sm:inline">
                How it works
              </button>
              <button type="button" onClick={() => scrollToId("product")} className="hidden text-[13px] text-muted hover:text-ink sm:inline">
                Product
              </button>
              <button type="button" onClick={() => scrollToId("stories")} className="hidden text-[13px] text-muted hover:text-ink md:inline">
                Stories
              </button>
              <button type="button" onClick={() => scrollToId("faq")} className="hidden text-[13px] text-muted hover:text-ink md:inline">
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

          <section className="relative z-10 mx-auto max-w-3xl shrink-0 px-6 pb-3 pt-10 text-center sm:pt-12">
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
              className="mt-3 text-[36px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[48px]"
            >
              Turn a file into{" "}
              <em className="font-serif font-normal italic">multi-channel outreach</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.16 }}
              className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-[#1d1d1f]/65"
            >
              Stop blasting a spreadsheet. Describe the goal. Haki drafts the workflow and waits for your review.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: 0.22 }}
              className="mt-5 flex items-center justify-center gap-3"
            >
              <Link
                href="/haki"
                className="inline-flex rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"
              >
                Open Haki AI
              </Link>
              <button
                type="button"
                onClick={() => scrollToId("how")}
                className="inline-flex rounded-full border border-black/15 bg-white/70 px-5 py-2.5 text-[14px] font-medium text-ink backdrop-blur hover:bg-white"
              >
                See the path
              </button>
            </motion.div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease, delay: 0.26 }}
            className="relative z-10 mt-auto min-h-0 translate-y-[-48px] px-3 sm:translate-y-[-72px] sm:px-10"
          >
            <Link
              href="/haki"
              className="block overflow-hidden rounded-t-[14px] border border-white/80 bg-white shadow-[0_-12px_60px_rgba(0,0,0,0.22)]"
            >
              <HakiAppPreview />
            </Link>
          </motion.div>
        </div>
      </div>

      <section className="border-y border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[13px] text-muted">
          <p>Bring a file you already sit in. Not a database of strangers.</p>
          <p className="font-mono text-[12px] tracking-[-0.02em] text-ink">CSV · XLSX · JSON</p>
        </div>
      </section>

      <Reveal id="how" className="mx-auto max-w-6xl px-6 py-28">
        <p className="text-[12px] tracking-[0.16em] text-faint uppercase">How it works</p>
        <h2 className="mt-3 max-w-2xl text-[36px] font-semibold tracking-[-0.035em] sm:text-[44px]">
          From the file to the first reply
        </h2>
        <p className="mt-4 max-w-xl text-[16px] leading-7 text-muted">
          You already did the hard part. You have the list. Haki qualifies, sequences, and runs the next touch so the work leads to conversations.
        </p>

        <div className="mt-14 overflow-hidden rounded-[16px] border border-line bg-[#111]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="text-[11px] text-white/45">Haki · campaign walkthrough</span>
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

        <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n}>
              <div className="font-mono text-[12px] text-faint">{step.n}</div>
              <div className="mt-3 font-serif text-[28px] italic tracking-[-0.03em]">{step.title}</div>
              <p className="mt-2 text-[14px] leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <section className="border-y border-line bg-white py-24">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-[12px] tracking-[0.16em] text-faint uppercase">The usual week</p>
            <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.035em] sm:text-[40px]">
              The list is ready. The follow-up is not.
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-7 text-muted">
              Most teams do not fail at finding a file. They fail at keeping the next touch honest across tools.
            </p>
          </div>
          <ProblemList />
        </div>
      </section>

      <section id="product" className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-0 bg-[#ebe6da]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(29,29,31,0.08)_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="text-[12px] tracking-[0.16em] text-[#7a7468] uppercase">Product</p>
          <h2 className="mt-3 max-w-2xl text-[32px] font-semibold tracking-[-0.035em] text-[#1d1d1f] sm:text-[40px]">
            Built like an outreach desk, not a newsletter tool
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#5c574e]">
            Four objects on one desk. Click a step. The rest stay in the pile, the way a real operator works.
          </p>
          <ProductDesk />
        </div>
      </section>

      <section className="bg-[#111] py-24 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-xl text-[36px] font-semibold tracking-[-0.035em] sm:text-[44px]">
            One path. Every channel. A stop when they answer.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-7 text-white/55">
            Email is one channel. Haki is the desk that keeps the next touch in the same campaign.
          </p>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-8 font-mono text-[12px] text-white/50">
            {FLOW.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-[12px] bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNELS.map((channel) => (
              <div key={channel.name} className="bg-[#111] px-5 py-5">
                <div className="text-[15px] font-medium">{channel.name}</div>
                <p className="mt-1 text-[13px] text-white/50">{channel.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Reveal className="mx-auto max-w-6xl px-6 py-28">
        <h2 className="text-[32px] font-semibold tracking-[-0.035em]">Who this is for</h2>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted">
          If you still need a database of strangers, you are earlier than Haki. If you already have names and a goal, this is the desk.
        </p>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {AUDIENCE.map((item) => (
            <div key={item.title}>
              <div className="text-[16px] font-semibold tracking-[-0.02em]">{item.title}</div>
              <p className="mt-3 text-[14px] leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <section className="border-y border-line bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-[32px] font-semibold tracking-[-0.035em]">What you put down</h2>
          <div className="mt-10 overflow-hidden rounded-[12px] border border-line">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f7f7f4] text-[12px] tracking-[0.08em] text-faint uppercase">
                <tr>
                  <th className="px-5 py-3 font-medium">The pile of tools</th>
                  <th className="px-5 py-3 font-medium">On Haki</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.old} className="border-t border-line">
                    <td className="px-5 py-4 text-muted">{row.old}</td>
                    <td className="px-5 py-4">{row.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Reveal id="stories" className="mx-auto max-w-7xl px-6 py-28">
        <h2 className="text-center text-[36px] font-semibold tracking-[-0.03em]">Loved by operators who run the path</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[15px] leading-7 text-muted">
          What teams say after they stop blasting a CSV and start reviewing multi-touch campaigns.
        </p>
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-5">
          {TESTIMONIALS.map((item) => (
            <article key={item.handle} className="mb-4 break-inside-avoid rounded-[22px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.04]">
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
        <h2 className="text-[32px] font-semibold tracking-[-0.035em]">Questions people ask first</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="cursor-pointer list-none text-[15px] font-medium tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="font-mono text-[12px] text-faint group-open:hidden">+</span>
                  <span className="hidden font-mono text-[12px] text-faint group-open:inline">−</span>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <div className="px-3 pb-3">
        <footer
          className="relative min-h-[80vh] overflow-hidden rounded-[20px] bg-cover bg-bottom"
          style={{ backgroundImage: "url(/haki-grassland.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#f7f7f4]/35 via-transparent to-black/30" />
          <div className="relative z-10 flex min-h-[80vh] flex-col">
            <div className="flex flex-1 flex-col items-center justify-end px-6 pb-[20vh] pt-[30vh]">
              <p className="font-serif text-[22vw] leading-none tracking-[-0.04em] text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.28)] sm:text-[18vw]">
                Haki
              </p>
              <p className="mt-3 text-[12px] tracking-[0.2em] text-white/80 uppercase">An MK Labs Product</p>
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
                <button type="button" onClick={() => scrollToId("stories")} className="hover:text-white">
                  Stories
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

function ProblemList() {
  const [open, setOpen] = useState(0);

  return (
    <div className="border-t border-line">
      {PAINS.map((pain, index) => {
        const active = open === index;
        return (
          <button
            key={pain.title}
            type="button"
            aria-expanded={active}
            onClick={() => setOpen(active ? -1 : index)}
            className="block w-full border-b border-line py-5 text-left"
          >
            <div className="flex items-baseline justify-between gap-6">
              <span className="font-mono text-[12px] text-faint">{String(index + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-[18px] font-medium tracking-[-0.02em]">{pain.title}</span>
              <span className="font-mono text-[12px] text-faint">{active ? "−" : "+"}</span>
            </div>
            <AnimatePresence initial={false}>
              {active ? (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease }}
                  className="overflow-hidden pl-10 pr-8 pt-3 text-[14px] leading-7 text-muted"
                >
                  {pain.body}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}

function ProductDesk() {
  const [open, setOpen] = useState(0);
  const feature = FEATURES[open];

  return (
    <div className="mt-14 grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr]">
      <div>
        <div className="space-y-2">
          {FEATURES.map((item, index) => {
            const active = open === index;
            return (
              <button
                key={item.kicker}
                type="button"
                onClick={() => setOpen(index)}
                className={`block w-full rounded-[16px] px-4 py-4 text-left transition ${
                  active ? "bg-[#1d1d1f] text-white shadow-[0_16px_36px_rgba(29,29,31,0.18)]" : "bg-white/55 text-ink hover:bg-white"
                }`}
              >
                <div className={`font-mono text-[11px] tracking-[0.14em] uppercase ${active ? "text-white/45" : "text-[#8a8478]"}`}>
                  {String(index + 1).padStart(2, "0")} · {item.kicker}
                </div>
                <div className="mt-1 text-[17px] font-semibold tracking-[-0.03em]">{item.title}</div>
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={feature.kicker}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease }}
            className="mt-6"
          >
            <p className="text-[15px] leading-7 text-[#5c574e]">{feature.body}</p>
            <ul className="mt-5 space-y-2">
              {feature.points.map((point) => (
                <li key={point} className="flex gap-2 text-[14px] leading-6 text-[#1d1d1f]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#007aff]" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative min-h-[460px]">
        <div className="absolute inset-x-6 bottom-0 h-16 rounded-full bg-black/10 blur-2xl" />
        {FEATURES.map((_, index) => (
          <motion.div
            key={FEATURES[index].kicker}
            className="absolute left-1/2 top-6 w-[min(100%,380px)]"
            animate={{
              x: `${(index - open) * 18 - 50}%`,
              y: Math.abs(index - open) * 18,
              rotate: (index - open) * 4,
              scale: index === open ? 1 : 0.94,
              zIndex: index === open ? 20 : 10 - Math.abs(index - open),
            }}
            transition={{ duration: 0.45, ease }}
          >
            <button type="button" onClick={() => setOpen(index)} className="block w-full text-left">
              <DeskCard index={index} active={index === open} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DeskCard({ index, active }: { index: number; active: boolean }) {
  const frame = `rounded-[18px] border bg-white p-5 shadow-[0_22px_50px_rgba(29,29,31,0.12)] ${
    active ? "border-white" : "border-black/5"
  }`;

  if (index === 0) {
    return (
      <div className={frame}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-[0.14em] text-faint uppercase">File preview</span>
          <span className="rounded-full bg-good-soft px-2 py-0.5 text-[11px] font-medium text-good">Mapped</span>
        </div>
        <div className="mt-4 flex gap-2">
          {["CSV", "XLSX", "JSON"].map((kind, i) => (
            <span
              key={kind}
              className={`rounded-[10px] px-2.5 py-1 text-[11px] font-medium ${i === 0 ? "bg-[#1d1d1f] text-white" : "bg-[#f2f2f7] text-muted"}`}
            >
              {kind}
            </span>
          ))}
        </div>
        <div className="mt-4 rounded-[12px] bg-[#f7f7f4] p-3 text-[13px]">
          <div className="flex justify-between border-b border-black/5 pb-2">
            <span>fried-shops.csv</span>
            <span className="text-muted">18 × 9</span>
          </div>
          {[
            ["email", "Email"],
            ["owner_name", "Contact"],
            ["notes", "Custom field"],
          ].map(([from, to]) => (
            <div key={from} className="flex justify-between py-1.5">
              <span className="font-mono text-[11px] text-muted">{from}</span>
              <span>{to}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={frame}>
        <div className="text-[11px] tracking-[0.14em] text-faint uppercase">ICP match</div>
        <div className="mt-4 flex items-end gap-4">
          <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[conic-gradient(#007aff_0_313deg,#e8e8ed_313deg)]">
            <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-white">
              <span className="text-[28px] font-semibold tracking-[-0.05em]">87</span>
              <span className="text-[10px] text-faint">score</span>
            </div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-good">Qualified</div>
            <p className="mt-1 text-[12px] leading-5 text-muted">Inside the band you wrote. You still pick the audience.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["SaaS", "50 to 500", "United States", "Founder"].map((chip) => (
            <span key={chip} className="rounded-full bg-[#f2f2f7] px-2.5 py-1 text-[11px] text-ink">
              {chip}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (index === 2) {
    const path = [
      { n: "01", label: "Lead enters", tone: "bg-[#1d1d1f] text-white" },
      { n: "02", label: "Email", tone: "bg-[#e8f1ff] text-[#007aff]" },
      { n: "03", label: "Wait 24h", tone: "bg-[#fff1e8] text-[#c93400]" },
      { n: "04", label: "Replied? Stop", tone: "bg-[#ededff] text-[#5856d6]" },
      { n: "05", label: "LinkedIn, then WhatsApp", tone: "bg-[#e4f6f3] text-[#128c7e]" },
    ];
    return (
      <div className={frame}>
        <div className="text-[11px] tracking-[0.14em] text-faint uppercase">Path</div>
        <div className="mt-4 space-y-2">
          {path.map((step) => (
            <div key={step.n} className="flex items-center gap-3">
              <span className={`flex h-8 min-w-8 items-center justify-center rounded-full text-[11px] font-medium ${step.tone}`}>
                {step.n}
              </span>
              <span className="text-[13px] font-medium">{step.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-muted">AI can draft. It cannot launch.</p>
      </div>
    );
  }

  return (
    <div className={frame}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-[0.14em] text-faint uppercase">Lead state</span>
        <span className="rounded-full bg-[#ededff] px-2 py-0.5 text-[11px] font-medium text-[#5856d6]">Simulation</span>
      </div>
      <div className="mt-4 rounded-[12px] bg-[#f7f7f4] p-3">
        <div className="text-[14px] font-semibold">Sofia Mendez</div>
        <div className="text-[12px] text-muted">Pilon Fry House</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
          <div>
            <div className="text-faint">Step</div>
            <div className="mt-0.5 font-medium">LinkedIn</div>
          </div>
          <div>
            <div className="text-faint">Status</div>
            <div className="mt-0.5 font-medium">Waiting</div>
          </div>
          <div>
            <div className="text-faint">Next</div>
            <div className="mt-0.5 font-medium">09:40</div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-muted">Nothing pretends to be a real send until a provider is connected.</p>
    </div>
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, ease, delay }}
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
              <p className="font-medium">Campaign preview: Fried Shop Owner Outreach.</p>
              <p className="text-muted">
                Goal: start conversations. Email, wait 24h, follow-up, LinkedIn, then WhatsApp.
              </p>
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
            <div className="overflow-hidden rounded-[8px] border border-line bg-white">
              <table className="w-full table-fixed text-left text-[11px]">
                <thead className="text-[9px] tracking-[0.12em] text-faint uppercase">
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
                          className={`text-[10px] ${status === "Qualified" ? "text-good" : "text-warn"}`}
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
