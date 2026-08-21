const MARKS = [
  { name: "Google", mark: GoogleMark },
  { name: "Microsoft", mark: MicrosoftMark },
  { name: "Salesforce", mark: SalesforceMark },
  { name: "HubSpot", mark: HubSpotMark },
  { name: "Notion", mark: NotionMark },
  { name: "Slack", mark: SlackMark },
  { name: "Sheets", mark: SheetsMark },
  { name: "Excel", mark: ExcelMark },
  { name: "Gmail", mark: GmailMark },
  { name: "LinkedIn", mark: LinkedInMark },
  { name: "WhatsApp", mark: WhatsAppMark },
  { name: "Hermes", mark: HermesMark },
] as const;

export function TrustStrip() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-[14px] text-muted">
          Bring a CSV from the tools you already sit in
        </p>
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {MARKS.map(({ name, mark: Mark }) => (
            <div key={name} className="flex flex-col items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6f6f8] ring-1 ring-black/[0.04]">
                <Mark />
              </span>
              <span className="text-[13px] font-medium tracking-[-0.02em] text-[#3a3a3c]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <circle cx="8.5" cy="8.5" r="3" fill="#4285F4" />
      <circle cx="15.5" cy="8.5" r="3" fill="#EA4335" />
      <circle cx="8.5" cy="15.5" r="3" fill="#FBBC05" />
      <circle cx="15.5" cy="15.5" r="3" fill="#34A853" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </svg>
  );
}

function SalesforceMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="#00A1E0"
        d="M8.2 15.8c-1.8 0-3.2-1.3-3.2-3 0-1.2.7-2.3 1.8-2.8C6.5 8.4 7.8 7.4 9.4 7.4c.6 0 1.2.1 1.7.4.7-1.3 2-2.2 3.6-2.2 2.1 0 3.8 1.6 4 3.6 1.5.3 2.6 1.6 2.6 3.2 0 1.8-1.5 3.3-3.3 3.3H8.2z"
      />
    </svg>
  );
}

function HubSpotMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="4.2" fill="#FF7A59" />
      <circle cx="12" cy="4.4" r="1.7" fill="#FF7A59" />
      <circle cx="19.2" cy="8.6" r="1.7" fill="#FF7A59" />
      <circle cx="19.2" cy="15.4" r="1.7" fill="#FF7A59" />
      <circle cx="12" cy="19.6" r="1.7" fill="#FF7A59" />
      <circle cx="4.8" cy="15.4" r="1.7" fill="#FF7A59" />
      <circle cx="4.8" cy="8.6" r="1.7" fill="#FF7A59" />
    </svg>
  );
}

function NotionMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="#1d1d1f"
        d="M6.4 4.5h11.7c.7 0 1.2.5 1.2 1.2v12.6c0 .7-.5 1.2-1.2 1.2H6.4c-.7 0-1.2-.5-1.2-1.2V5.7c0-.7.5-1.2 1.2-1.2zm2 2.4v10.2h1.6l4.8-7.4v7.4h1.7V6.9h-1.6L9.9 14.4V6.9H8.4z"
      />
    </svg>
  );
}

function SlackMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect x="9.2" y="2.6" width="3.2" height="8" rx="1.6" fill="#E01E5A" />
      <rect x="13.8" y="6.2" width="8" height="3.2" rx="1.6" fill="#36C5F0" />
      <rect x="11.6" y="13.4" width="3.2" height="8" rx="1.6" fill="#2EB67D" />
      <rect x="2.2" y="14.6" width="8" height="3.2" rx="1.6" fill="#ECB22E" />
    </svg>
  );
}

function SheetsMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect x="5" y="3.5" width="14" height="17" rx="2" fill="#34A853" />
      <path fill="#fff" d="M8 8h8v1.4H8zm0 3.2h8v1.4H8zm0 3.2h8V16H8z" />
    </svg>
  );
}

function ExcelMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="#217346" />
      <path fill="#fff" d="M8.2 7.4 12 12l-3.8 4.6h2.3L12 13.7l1.5 2.9h2.3L12 12l3.8-4.6h-2.3L12 10.3 10.5 7.4z" />
    </svg>
  );
}

function GmailMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path fill="#EA4335" d="M4 7.2 12 13l8-5.8V18H4z" />
      <path fill="#4285F4" d="M20 7.2 12 13l-8-5.8V6l8 5.8L20 6z" />
      <path fill="#34A853" d="M4 7.2V18h2.4V9z" />
      <path fill="#FBBC05" d="M17.6 9V18H20V7.2z" />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#0A66C2" />
      <path fill="#fff" d="M8.1 10.2H6.2V17h1.9zm-.9-3.1c-.6 0-1.1.5-1.1 1.1s.5 1.1 1.1 1.1 1.1-.5 1.1-1.1-.5-1.1-1.1-1.1zM17.8 13.3c0-2-1.1-3.3-2.9-3.3-1.1 0-1.8.5-2.2 1.1V10.2h-1.9V17h1.9v-3.4c0-.9.5-1.5 1.3-1.5s1.2.5 1.2 1.5V17h1.9v-3.7z" />
    </svg>
  );
}

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#25D366" />
      <path
        fill="#fff"
        d="M8.4 16.4 9 14.2a5.3 5.3 0 0 1-1.3-3.4 5.3 5.3 0 0 1 10.6 0 5.3 5.3 0 0 1-7.6 4.8zm6.3-4.6c.1.6-.2 1.2-.4 1.3l-.7.4c-.2.1-.5.3-1.1 0-.7-.3-1.6-1-2.1-1.8-.3-.4-.6-.9-.5-1.2l.3-.7c.1-.2.1-.5-.1-.6l-.6-.7c-.2-.2-.5-.2-.7 0l-.6.6c-.3.4-.4 1 .1 1.8.8 1.4 2 2.6 3.6 3.3.8.3 1.4.3 1.8 0l.6-.6c.2-.2.2-.5 0-.7l-.6-.6c-.2-.2-.5-.2-.6-.1z"
      />
    </svg>
  );
}

function HermesMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="#1d1d1f" />
      <path fill="#fff" d="M8 7.4h1.8v3.4h4.4V7.4H16V16.6h-1.8v-4h-4.4v4H8z" />
    </svg>
  );
}
