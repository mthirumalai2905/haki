"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronUp,
  Globe,
  Layers3,
  LayoutGrid,
  MessageSquare,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toaster";

const items: Array<{
  href: string;
  label: string;
  icon: typeof Globe;
  beta?: boolean;
}> = [
  { href: "/universal", label: "Universal", icon: Globe, beta: true },
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Layers3 },
  { href: "/sequences", label: "Sequences", icon: Workflow },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

type HakiSession = { id: string; title: string; updatedAt: string };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessions, setSessions] = useState<HakiSession[]>([]);
  const [creating, setCreating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const onHaki = pathname === "/haki" || pathname.startsWith("/haki/");

  function loadSessions() {
    api<{ items: HakiSession[] }>("/api/hermes/sessions")
      .then((data) => setSessions(data.items ?? []))
      .catch(() => undefined);
  }

  useEffect(() => {
    loadSessions();
    const onChange = () => loadSessions();
    window.addEventListener("haki-sessions-changed", onChange);
    return () => window.removeEventListener("haki-sessions-changed", onChange);
  }, [pathname]);

  async function newSession(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (creating) return;
    setCreating(true);
    try {
      const created = await api<{ id: string }>("/api/hermes/sessions", { method: "POST" });
      window.dispatchEvent(new Event("haki-sessions-changed"));
      setDrawerOpen(true);
      router.push(`/haki/${created.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="relative z-30 flex w-[220px] shrink-0 flex-col bg-sidebar">
      <div className="flex h-12 items-center px-3.5">
        <Link href="/" className="flex items-center gap-3 rounded-[8px] hover:opacity-80">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/10" />
            <span className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/10" />
          </div>
          <div>
            <div className="text-[13px] font-semibold tracking-[-0.02em] text-ink">Haki</div>
            <div className="text-[10px] leading-none text-faint">An MK Labs Product</div>
          </div>
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2 pt-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={(event) => {
                event.preventDefault();
                router.push(item.href);
              }}
              className={cn(
                "relative z-10 flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13px]",
                item.beta && "mt-0.5 pt-2.5",
                active ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted hover:bg-white/60 hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active ? "text-accent" : "")} />
              <span className="relative">
                {item.beta ? (
                  <span className="absolute -top-2 left-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-warn">
                    Beta
                  </span>
                ) : null}
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="mt-auto min-h-0 border-t border-line/80 pt-1">
          {drawerOpen ? (
            <div className="mb-1 max-h-[240px] space-y-0.5 overflow-auto">
              {pathname === "/haki" ? (
                <div className="rounded-[8px] bg-white/80 px-2.5 py-1.5 text-[12px] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  New session
                </div>
              ) : null}
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  active={pathname === `/haki/${session.id}`}
                  onOpen={() => router.push(`/haki/${session.id}`)}
                  onRenamed={loadSessions}
                  onDeleted={() => {
                    loadSessions();
                    if (pathname === `/haki/${session.id}`) router.push("/haki");
                  }}
                />
              ))}
              {!sessions.length && pathname !== "/haki" ? (
                <p className="px-2.5 py-2 text-[11px] text-faint">No sessions yet. Use + to start one.</p>
              ) : null}
            </div>
          ) : null}

          <div
            className={cn(
              "flex items-center gap-1 rounded-[8px] px-1.5 py-1 text-[13px]",
              onHaki || drawerOpen ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-muted hover:bg-white/60 hover:text-ink",
            )}
          >
            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              className="flex min-w-0 flex-1 items-center gap-2.5 px-1 py-0.5 text-left"
            >
              <MessageSquare className={cn("h-3.5 w-3.5", onHaki || drawerOpen ? "text-accent" : "")} />
              <span className="flex-1">Haki AI</span>
              <ChevronUp
                className={cn("h-3.5 w-3.5 text-faint transition-transform", drawerOpen ? "rotate-180" : "")}
              />
            </button>
            <button
              type="button"
              title="New session"
              onClick={newSession}
              className="rounded-[6px] p-0.5 text-faint hover:bg-[#f2f2f7] hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="px-2 pb-3">
        <div className="mb-2 rounded-[10px] bg-white/70 px-2.5 py-2">
          <div className="text-[10px] font-medium text-faint">Mode</div>
          <div className="mt-0.5 text-[12px] text-accent">Simulation</div>
        </div>
        <Link
          href="/settings"
          prefetch
          onClick={(event) => {
            event.preventDefault();
            router.push("/settings");
          }}
          className={cn(
            "flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13px]",
            pathname.startsWith("/settings")
              ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              : "text-muted hover:bg-white/60 hover:text-ink",
          )}
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

function SessionRow({
  session,
  active,
  onOpen,
  onRenamed,
  onDeleted,
}: {
  session: HakiSession;
  active: boolean;
  onOpen: () => void;
  onRenamed: () => void;
  onDeleted: () => void;
}) {
  const { toast, dismiss } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(session.title);
  }, [session.title]);

  async function saveName() {
    const next = title.trim();
    if (!next || next === session.title) {
      setTitle(session.title);
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await api(`/api/hermes/sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: next }),
      });
      window.dispatchEvent(new Event("haki-sessions-changed"));
      onRenamed();
      setEditing(false);
      toast({ title: "Session renamed", body: next, tone: "good" });
    } catch (error) {
      toast({
        title: "Could not rename",
        body: error instanceof Error ? error.message : "Try again.",
        tone: "bad",
      });
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    const name = session.title || "this session";
    const id = toast({
      title: "Delete this session?",
      body: `${name} will be removed from Haki AI. You can keep it if this was a miss.`,
      tone: "warn",
      duration: 0,
      actions: [
        {
          label: "Keep",
          onClick: () => dismiss(id),
        },
        {
          label: "Delete",
          tone: "danger",
          onClick: async () => {
            dismiss(id);
            setBusy(true);
            try {
              await api(`/api/hermes/sessions/${session.id}`, { method: "DELETE" });
              window.dispatchEvent(new Event("haki-sessions-changed"));
              onDeleted();
              toast({ title: "Session deleted", body: name, tone: "good" });
            } catch (error) {
              toast({
                title: "Could not delete",
                body: error instanceof Error ? error.message : "Try again.",
                tone: "bad",
              });
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    });
  }

  if (editing) {
    return (
      <form
        className="rounded-[8px] bg-white px-1.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        onSubmit={(event) => {
          event.preventDefault();
          void saveName();
        }}
      >
        <input
          autoFocus
          value={title}
          disabled={busy}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => void saveName()}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setTitle(session.title);
              setEditing(false);
            }
          }}
          className="w-full rounded-[6px] bg-[#f5f5f7] px-2 py-1 text-[12px] outline-none"
        />
      </form>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-[8px] pr-1",
        active ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "text-muted hover:bg-white/60 hover:text-ink",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 truncate px-2.5 py-1.5 text-left text-[12px]"
      >
        {session.title || "Session"}
      </button>
      <button
        type="button"
        title="Rename session"
        disabled={busy}
        onClick={() => setEditing(true)}
        className="rounded-[5px] p-0.5 text-faint opacity-0 hover:bg-[#f2f2f7] hover:text-ink group-hover:opacity-100"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        title="Delete session"
        disabled={busy}
        onClick={() => void remove()}
        className="rounded-[5px] p-0.5 text-faint opacity-0 hover:bg-[#ffe5e8] hover:text-bad group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
