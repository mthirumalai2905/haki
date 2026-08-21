"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, FileUp, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { IngestPreview, type PreviewLead } from "./IngestPreview";
import { Markdown, toolLabel } from "./Markdown";
import { readWorkspaceSession, writeWorkspaceSession } from "@/lib/haki/session";
import type { HermesChatMessage, HermesProposal } from "@/lib/hermes/types";

type Starter = { title: string; body: string; hint: string };

function wantsPreview(text: string) {
  return /preview|ingested leads|show (me )?(the )?(leads|file|data|rows|table)|open (the )?table/i.test(
    text,
  );
}

export function HakiHome({ sessionId }: { sessionId?: string }) {
  const router = useRouter();
  const [leads, setLeads] = useState<PreviewLead[]>([]);
  const [total, setTotal] = useState(0);
  const [starters, setStarters] = useState<Starter[]>([]);
  const [messages, setMessages] = useState<HermesChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(sessionId);
  const [proposal, setProposal] = useState<HermesProposal | null>(null);
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [tab, setTab] = useState<"leads" | "campaign">("leads");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatPct, setChatPct] = useState(38);
  const splitRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const live = useRef({ threadId, proposal, campaignId });
  live.current = { threadId, proposal, campaignId };

  useEffect(() => {
    const seed = sessionStorage.getItem("haki:seed");
    if (seed) {
      sessionStorage.removeItem("haki:seed");
      void send(seed);
    }
  }, []);

  useEffect(() => {
    api<{ items: PreviewLead[]; total: number }>("/api/leads?pageSize=100")
      .then((data) => {
        setLeads(data.items);
        setTotal(data.total);
      })
      .catch(() => undefined);
    api<{ starters: Starter[] }>("/api/hermes/starters?kind=campaign")
      .then((data) => setStarters(data.starters ?? []))
      .catch(() => setStarters([]));

    setMessages([]);
    setInput("");
    setProposal(null);
    setCampaignId(undefined);
    setShowPreview(false);
    setTab("leads");
    setThreadId(sessionId);

    if (!sessionId) {
      return;
    }

    const local = readWorkspaceSession();
    if (local.threadId === sessionId && local.proposal?.workflow) {
      setProposal(local.proposal);
      setCampaignId(local.campaignId);
      setThreadId(local.threadId);
      setShowPreview(true);
      setTab("campaign");
    }

    api<{
      threadId?: string;
      campaignId?: string;
      proposal?: HermesProposal | null;
      messages?: HermesChatMessage[];
    }>(`/api/hermes/session?threadId=${encodeURIComponent(sessionId)}`)
      .then((remote) => {
        setThreadId(remote.threadId || sessionId);
        if (remote.messages?.length) setMessages(remote.messages);
        if (remote.proposal?.workflow) {
          setProposal(remote.proposal);
          setCampaignId(remote.campaignId || remote.proposal.campaignId);
          setShowPreview(true);
          setTab("campaign");
        }
      })
      .catch(() => undefined);
  }, [sessionId]);

  useEffect(() => {
    writeWorkspaceSession({ threadId, campaignId, proposal });
  }, [threadId, campaignId, proposal]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      setChatPct(Math.min(72, Math.max(22, next)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    if (wantsPreview(message)) {
      setShowPreview(true);
      setTab("leads");
    }
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "user", content: message }]);
    try {
      const result = await api<{
        threadId: string;
        proposal?: HermesProposal;
        campaignId?: string;
        messages: HermesChatMessage[];
      }>("/api/hermes/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          kind: "campaign",
          threadId: live.current.threadId,
          campaignId: live.current.campaignId,
          current: live.current.proposal,
        }),
      });
      setThreadId(result.threadId);
      setMessages(result.messages);
      window.dispatchEvent(new Event("haki-sessions-changed"));
      if (!sessionId && result.threadId) {
        router.replace(`/haki/${result.threadId}`);
      }
      if (result.campaignId) setCampaignId(result.campaignId);
      if (result.proposal && result.proposal.kind !== "none") {
        setProposal(result.proposal);
        setShowPreview(true);
        if (!wantsPreview(message)) setTab("campaign");
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Haki could not complete that turn.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (campaignId) {
      router.push(`/campaigns/${campaignId}`);
      return;
    }
    if (!proposal?.workflow) return;
    setSaving(true);
    try {
      const created = await api<{ id: string }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: proposal.name,
          goal: proposal.goal || "start_conversations",
          audience: proposal.audience,
          channels: proposal.channels,
          workflow: proposal.workflow,
          messages: proposal.messages,
        }),
      });
      setCampaignId(created.id);
      router.push(`/campaigns/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  const empty = messages.length === 0 && !busy;

  return (
    <div ref={splitRef} className="flex min-h-0 flex-1 bg-white">
      <section
        className={`flex min-h-0 flex-col ${showPreview ? "min-w-[240px] shrink-0" : "min-w-0 flex-1"}`}
        style={showPreview ? { width: `${chatPct}%` } : undefined}
      >
        {empty ? (
          <>
            <div className="flex items-start justify-between px-8 pt-6">
              <p className="max-w-xl text-[13px] leading-5 text-muted">
                Upload a file. Describe the goal. Haki drafts the workflow. Nothing reaches a person until you review it.
              </p>
              {proposal ? (
                <Button size="sm" onClick={saveDraft} disabled={saving}>
                  {saving ? "Saving…" : campaignId ? "Open campaign" : "Save draft"}
                </Button>
              ) : null}
            </div>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 pb-12">
              <h1 className="font-serif text-[48px] leading-none tracking-[-0.03em] text-ink">
                Who do you want to reach?
              </h1>
              <p className="mt-3 text-[15px] text-muted">
                Describe the campaign. Haki works from your ingested file.
              </p>
              <div className="mt-8 w-full max-w-[760px]">
                <Composer
                  input={input}
                  busy={busy}
                  messages={messages}
                  proposal={proposal}
                  onChange={setInput}
                  onSend={send}
                  large
                />
              </div>
              {starters.length ? (
                <div className="mt-10 w-full max-w-[720px]">
                  <div className="mb-3 text-[14px] font-semibold">Suggested for this workspace</div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {starters.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => send(item.body)}
                        className="rounded-[14px] border border-line bg-white px-3.5 py-3 text-left hover:border-line-strong hover:bg-[#fafafa]"
                      >
                        <div className="text-[13px] font-medium">{item.title}</div>
                        <div className="mt-1 text-[12px] leading-4 text-muted">{item.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            {proposal && showPreview ? (
              <div className="flex justify-end px-6 py-3">
                <Button size="sm" onClick={saveDraft} disabled={saving}>
                  {saving ? "Saving…" : campaignId ? "Open campaign" : "Save draft"}
                </Button>
              </div>
            ) : null}
            <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
              <div className="mx-auto w-full max-w-[680px] space-y-6 px-6 py-8">
                {messages.map((item) =>
                  item.role === "user" ? (
                    <div key={item.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-[20px] bg-accent px-4 py-2.5 text-[14px] leading-6 text-white">
                        {item.content}
                      </div>
                    </div>
                  ) : (
                    <div key={item.id} className="space-y-2">
                      <Markdown text={item.content} />
                      {item.toolsUsed?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.toolsUsed.map((tool) => (
                            <span key={tool} className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[11px] text-muted">
                              {toolLabel(tool)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ),
                )}
                {busy ? <p className="text-[13px] text-muted">Working…</p> : null}
                <div ref={end} />
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <Composer
                input={input}
                busy={busy}
                messages={messages}
                proposal={proposal}
                onChange={setInput}
                onSend={send}
              />
            </div>
          </>
        )}
      </section>

      {showPreview ? (
        <>
          <button
            type="button"
            aria-label="Resize chat and preview"
            onMouseDown={() => {
              dragging.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="group relative z-10 w-1.5 shrink-0 cursor-col-resize bg-line hover:bg-accent"
          >
            <span className="absolute inset-y-0 -left-1 -right-1" />
          </button>
          <IngestPreview
            leads={leads}
            total={total}
            proposal={proposal}
            campaignId={campaignId}
            tab={tab}
            onTab={setTab}
          />
        </>
      ) : null}
    </div>
  );
}

type BrowserSpeech = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function speechCtor() {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: new () => BrowserSpeech;
    webkitSpeechRecognition?: new () => BrowserSpeech;
  };
  return host.SpeechRecognition || host.webkitSpeechRecognition || null;
}

function useDictation(input: string, onChange: (value: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const rec = useRef<BrowserSpeech | null>(null);
  const base = useRef("");
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    setSupported(Boolean(speechCtor()));
    return () => rec.current?.stop();
  }, []);

  function toggle() {
    const Ctor = speechCtor();
    if (!Ctor) return;

    if (listening && rec.current) {
      rec.current.stop();
      return;
    }

    const next = new Ctor();
    next.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    next.continuous = true;
    next.interimResults = true;
    base.current = inputRef.current.replace(/\s+$/, "");
    if (base.current) base.current += " ";

    next.onresult = (event) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      if (finalText) base.current = `${base.current}${finalText} `.replace(/\s+/g, " ");
      onChange(`${base.current}${interim}`.trimStart());
    };
    next.onerror = () => {
      setListening(false);
    };
    next.onend = () => {
      setListening(false);
      rec.current = null;
    };

    rec.current = next;
    next.start();
    setListening(true);
  }

  return { listening, supported, toggle };
}

const CONTEXT_WINDOW = 64_000;

function sessionContext(
  messages: HermesChatMessage[],
  proposal: HermesProposal | null | undefined,
  input: string,
) {
  const text = [
    ...messages.map((item) => item.content),
    input,
    proposal ? JSON.stringify(proposal) : "",
  ].join("\n");
  const used = Math.ceil(text.length / 4) + 900;
  const pct = Math.min(100, Math.round((used / CONTEXT_WINDOW) * 100));
  return { used, window: CONTEXT_WINDOW, pct };
}

function Composer({
  input,
  busy,
  messages,
  proposal,
  onChange,
  onSend,
  large,
}: {
  input: string;
  busy: boolean;
  messages: HermesChatMessage[];
  proposal?: HermesProposal | null;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  large?: boolean;
}) {
  const context = sessionContext(messages, proposal, input);
  const voice = useDictation(input, onChange);

  return (
    <form
      className="mx-auto w-full max-w-[760px]"
      onSubmit={(event) => {
        event.preventDefault();
        onSend(input);
      }}
    >
      <div className="rounded-[22px] border border-line bg-[#f7f7f8] p-4 shadow-[0_10px_32px_rgba(0,0,0,0.05)]">
        <textarea
          className={`w-full resize-none bg-transparent text-[15px] leading-6 outline-none placeholder:text-faint ${
            large ? "min-h-[120px]" : "min-h-[88px] max-h-40"
          }`}
          placeholder="Describe your outreach in natural language. Tip: ask to preview the ingested leads."
          value={input}
          rows={large ? 5 : 3}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend(input);
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Haki AI
            </span>
            <Link href="/leads/import" className="inline-flex items-center gap-1.5 hover:text-ink">
              <FileUp className="h-3.5 w-3.5" />
              Upload file
            </Link>
            {voice.listening ? <span className="text-bad">Listening</span> : null}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={voice.toggle}
              disabled={!voice.supported}
              title={
                voice.supported
                  ? voice.listening
                    ? "Stop dictation"
                    : "Voice to text"
                  : "Voice to text needs Chrome or Edge"
              }
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                voice.listening
                  ? "bg-bad text-white"
                  : "bg-[#e8e8ed] text-ink hover:bg-white disabled:opacity-30"
              }`}
            >
              <Mic className={`h-4 w-4 ${voice.listening ? "animate-pulse" : ""}`} />
            </button>
            <ContextRing used={context.used} window={context.window} pct={context.pct} />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8e8ed] text-ink hover:bg-accent hover:text-white disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ContextRing({ used, window, pct }: { used: number; window: number; pct: number }) {
  const size = 34;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const tone = pct >= 90 ? "#ff375f" : pct >= 70 ? "#ff9f0a" : "#007aff";
  const label = `${formatTokens(used)} of ${formatTokens(window)} in this session`;

  return (
    <div className="group relative" title={label}>
      <svg width={size} height={size} className="-rotate-90" aria-label={`Context ${pct}%`} role="img">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e5ea" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tracking-[-0.04em] text-ink">
        H
      </span>
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-[200px] rounded-[12px] border border-line bg-white px-3 py-2 text-left text-[11px] leading-4 text-muted shadow-[0_12px_30px_rgba(0,0,0,0.1)] group-hover:block">
        <div className="font-medium text-ink">Session window {pct}%</div>
        {label}. The ring fills as this chat, the draft, and the file context grow.
      </div>
    </div>
  );
}

function formatTokens(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}
