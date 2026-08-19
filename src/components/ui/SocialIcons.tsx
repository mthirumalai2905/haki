"use client";

import { cn } from "@/lib/utils";

export type SocialKey =
  | "whatsapp"
  | "linkedin"
  | "instagram"
  | "x"
  | "youtube"
  | "reddit"
  | "tiktok"
  | "googleWorkspace";

export type SocialLinks = Partial<Record<SocialKey, string | null | undefined>>;

const NETWORKS: Array<{
  key: SocialKey;
  label: string;
  color: string;
  href: (value: string) => string;
}> = [
  { key: "whatsapp", label: "WhatsApp", color: "#25D366", href: (v) => (v.startsWith("http") ? v : `https://wa.me/${v.replace(/\D/g, "")}`) },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2", href: (v) => v },
  { key: "instagram", label: "Instagram", color: "#E1306C", href: (v) => v },
  { key: "x", label: "Twitter / X", color: "#111111", href: (v) => v },
  { key: "youtube", label: "YouTube", color: "#FF0000", href: (v) => v },
  { key: "reddit", label: "Reddit", color: "#FF4500", href: (v) => v },
  { key: "tiktok", label: "TikTok", color: "#111111", href: (v) => v },
  { key: "googleWorkspace", label: "Google Workspace", color: "#4285F4", href: (v) => v },
];

function Icon({ name }: { name: SocialKey }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const };
  if (name === "whatsapp") {
    return (
      <svg {...common}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.86 9.86 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C22 6.45 17.5 2 12.04 2Zm5.77 14.04c-.24.67-1.4 1.24-1.94 1.32-.5.07-1.14.1-1.84-.12-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.23-5.01-4.43-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.24.6.82 2.07.89 2.22.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.3.39-.43.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.39-.24.66-.15.27.1 1.71.81 2 .95.3.15.49.22.56.34.08.12.08.7-.16 1.37Z" />
      </svg>
    );
  }
  if (name === "linkedin") {
    return (
      <svg {...common}>
        <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.48h4.52V24H.24V8.48zM8.22 8.48h4.33v2.12h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.01 5.42 6.93V24h-4.52v-7.6c0-1.81-.03-4.14-2.52-4.14-2.53 0-2.91 1.97-2.91 4v7.74H8.22V8.48z" />
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg {...common}>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2zm0 2A2.8 2.8 0 1 0 14.8 12 2.8 2.8 0 0 0 12 9.2zM17.7 6.3a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg {...common}>
        <path d="M14.7 10.3 22.4 2h-1.8l-6.7 7.2L8.6 2H2.2l8.1 11.5L2.2 22h1.8l7.1-7.7L15.4 22h6.4l-7.1-11.7zM12 13.2l-.8-1.1L4.7 3.3h2.8l5.2 7.3.8 1.1 6.8 9.5h-2.8L12 13.2z" />
      </svg>
    );
  }
  if (name === "youtube") {
    return (
      <svg {...common}>
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
      </svg>
    );
  }
  if (name === "reddit") {
    return (
      <svg {...common}>
        <path d="M14.5 3.2 16.7 8a4.8 4.8 0 0 1 3.1.8 2.2 2.2 0 1 1-1.5 4 6.8 6.8 0 0 1-4 1.5c.1.5.1 1 .1 1.5 0 2.8-2.5 5-6.4 5s-6.4-2.2-6.4-5c0-.5 0-1 .1-1.5a6.8 6.8 0 0 1-4-1.5 2.2 2.2 0 1 1-1.5-4 4.8 4.8 0 0 1 3.1-.8l2.2-4.8 3.1 1.1L8.3 3l-.8 3.8c1.4-.2 2.9-.2 4.3 0L11.1 3l3.4.2zM8.2 14.6a1.3 1.3 0 1 0-1.3 1.3 1.3 1.3 0 0 0 1.3-1.3zm7.8 0A1.3 1.3 0 1 0 14.7 16 1.3 1.3 0 0 0 16 14.6zm-7.4 3.1c.8.8 2.4 1.1 3.4 1.1s2.6-.3 3.4-1.1a.6.6 0 0 0-.8-.8c-.6.5-1.8.8-2.6.8s-2-.3-2.6-.8a.6.6 0 1 0-.8.8z" />
      </svg>
    );
  }
  if (name === "tiktok") {
    return (
      <svg {...common}>
        <path d="M14.5 3c.4 2.4 1.8 4.2 4.2 4.6v3.1c-1.4 0-2.7-.4-3.9-1.1v6.8A6.4 6.4 0 1 1 8.2 10v3.2a3.2 3.2 0 1 0 2.4 3.1V3h3.9z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.8 8.2h-1.8v1.3H16.8V13h-1.8v3h-1.7v-3h-1.4V11.5h1.4V10.4c0-1.4.6-2.4 2.3-2.4h1.5v1.6h-.9c-.5 0-.7.2-.7.7v.9zM8.6 8.6l1.8 3.3 1.8-3.3h1.9l-2.8 4.6V17H9.5v-3.8L6.7 8.6h1.9z" />
    </svg>
  );
}

export function SocialIconRow({
  links,
  showMissing = true,
  size = "sm",
}: {
  links: SocialLinks;
  showMissing?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
      {NETWORKS.map((network) => {
        const value = links[network.key];
        const active = Boolean(value);
        if (!active && !showMissing) return null;
        const className = cn(
          "inline-flex items-center justify-center rounded-md border transition-colors",
          size === "sm" ? "h-7 w-7" : "h-8 w-8",
          active
            ? "border-line bg-surface hover:border-line-strong"
            : "border-transparent bg-paper text-faint opacity-35",
        );
        if (active && value) {
          return (
            <a
              key={network.key}
              href={network.href(value)}
              target="_blank"
              rel="noreferrer"
              title={network.label}
              className={className}
              style={{ color: network.color }}
            >
              <Icon name={network.key} />
            </a>
          );
        }
        return (
          <span key={network.key} title={`${network.label} missing`} className={className}>
            <Icon name={network.key} />
          </span>
        );
      })}
    </div>
  );
}

export function SocialDetailList({ links }: { links: SocialLinks }) {
  return (
    <div className="space-y-2">
      {NETWORKS.map((network) => {
        const value = links[network.key];
        return (
          <div key={network.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-paper" style={{ color: value ? network.color : undefined }}>
                <Icon name={network.key} />
              </span>
              {network.label}
            </div>
            {value ? (
              <a
                href={network.href(value)}
                target="_blank"
                rel="noreferrer"
                className="max-w-[200px] truncate text-ink underline decoration-line hover:decoration-ink"
              >
                {value}
              </a>
            ) : (
              <span className="text-faint">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
