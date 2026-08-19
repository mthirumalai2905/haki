import Link from "next/link";

const ROWS = [
  ["Pilon Fry House", "Sofia Mendez", "casa@pilonfryhouse.demo", "Qualified"],
  ["Saltine Fry", "Eli Hart", "hello@saltinefry.demo", "Maybe"],
  ["Bird & Basket", "June Cole", "june@birdandbasket.demo", "Qualified"],
  ["Crisp & Co", "Marcus Bell", "hello@crispandco.demo", "Maybe"],
  ["Gold Batter", "Priya Shah", "priya@goldbatter.demo", "Qualified"],
];

const STEPS = [
  { n: "01", title: "Upload", body: "Bring a CSV or XLSX. Haki does not scrape leads." },
  { n: "02", title: "Preview", body: "First 100 rows. Map fields. Confirm the import." },
  { n: "03", title: "Ask Haki", body: "Describe who to reach. Hermes drafts the workflow." },
  { n: "04", title: "Review", body: "Nothing sends until you say so. Simulation first." },
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

const NAV = ["Haki AI", "Universal", "Overview", "Hermes", "Leads", "Campaigns", "Sequences", "Analytics"];

export function LandingPage() {
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
              <Link href="/" className="flex items-center gap-2 pl-1 pr-2 text-[14px] font-semibold tracking-[-0.03em]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-[11px] text-white">
                  H
                </span>
                Haki
              </Link>
              <a href="#how" className="text-[13px] text-muted hover:text-ink">
                How it works
              </a>
              <a href="#about" className="text-[13px] text-muted hover:text-ink">
                About
              </a>
              <Link
                href="/haki"
                className="rounded-full bg-[#1d1d1f] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-black"
              >
                Open Haki
              </Link>
            </nav>
          </header>

          <section className="relative z-10 mx-auto max-w-3xl px-6 pb-10 pt-24 text-center sm:pt-32">
            <p className="text-[13px] text-[#1d1d1f]/70">Outreach OS for lists you already have</p>
            <h1 className="mt-4 text-[40px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] sm:text-[56px]">
              Helping you turn a file into{" "}
              <em className="font-serif font-normal italic">multi-channel outreach</em>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-7 text-[#1d1d1f]/65">
              Say bye to blasting a CSV. Describe the goal. Haki drafts the workflow and waits for your review.
            </p>
            <Link
              href="/haki"
              className="mt-7 inline-flex rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"
            >
              Open Haki AI
            </Link>
          </section>

          <div className="relative z-10 px-3 pt-10 sm:px-8 sm:pt-16">
            <Link
              href="/haki"
              className="block overflow-hidden rounded-t-[16px] border border-white/70 bg-white shadow-[0_-18px_70px_rgba(0,0,0,0.2)]"
            >
              <HakiAppPreview />
            </Link>
          </div>
        </div>
      </div>

      <section id="how" className="mx-auto max-w-5xl px-6 py-28">
        <h2 className="text-center text-[36px] font-semibold tracking-[-0.03em]">How it works</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-7 text-muted">
          Data in. Workflow out. Not a lead database. Not an email blaster.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="rounded-[18px] border border-line bg-white p-5">
              <div className="text-[12px] text-faint">{step.n}</div>
              <div className="mt-2 text-[16px] font-medium">{step.title}</div>
              <p className="mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
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
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-28">
        <h2 className="text-center text-[32px] font-semibold tracking-[-0.03em]">One workflow. Every channel.</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => (
            <div key={channel.name} className="rounded-[18px] border border-line bg-white px-4 py-4">
              <div className="text-[15px] font-medium">{channel.name}</div>
              <p className="mt-1 text-[13px] leading-5 text-muted">{channel.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="font-serif text-[40px] italic tracking-[-0.03em]">Peace of mind before anything sends</h2>
        <p className="mt-5 text-[16px] leading-8 text-muted">
          Haki starts with a file you already have. It qualifies, sequences, and runs outreach in simulation until you
          connect a provider. You always review first.
        </p>
        <Link
          href="/haki"
          className="mt-8 inline-flex rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"
        >
          Open Haki AI
        </Link>
      </section>

      <div className="px-3 pb-3">
        <footer
          className="relative min-h-[88vh] overflow-hidden rounded-[28px] bg-cover bg-bottom"
          style={{ backgroundImage: "url(/haki-grassland.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#f4f4f2]/40 via-transparent to-black/25" />
          <div className="relative z-10 flex min-h-[88vh] flex-col">
            <div className="flex flex-1 items-end justify-center px-6 pb-[26vh] pt-[34vh]">
              <p className="font-serif text-[22vw] leading-none tracking-[-0.04em] text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.28)] sm:text-[18vw]">
                Haki
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 px-6 pb-8 text-center text-white/90 sm:flex-row sm:justify-between">
              <span className="text-[13px] font-medium">Haki</span>
              <div className="flex gap-5 text-[13px]">
                <Link href="/haki" className="hover:text-white">
                  Haki AI
                </Link>
                <a href="#how" className="hover:text-white">
                  How it works
                </a>
                <a href="#about" className="hover:text-white">
                  About
                </a>
              </div>
              <span className="text-[12px] text-white/70">Simulation workspace · Nothing is sent for real</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
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
              <p className="font-medium">Here’s your campaign preview — “Fried Shop Owner Outreach”:</p>
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
