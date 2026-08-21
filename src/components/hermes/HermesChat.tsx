"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Markdown } from "@/components/haki/Markdown";
import { api } from "@/lib/api";
import type { HermesChatMessage, HermesProposal } from "@/lib/hermes/types";

type Starter = { title: string; body: string; hint: string };

export function HermesChat({
  kind,
  current,
  campaignId,
  onProposal,
}: {
  kind: "campaign" | "sequence";
  current?: HermesProposal | null;
  campaignId?: string;
  onProposal: (proposal: HermesProposal) => void;
}) {
  const [messages, setMessages] = useState<HermesChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [provider, setProvider] = useState<"deepseek" | "local" | null>(null);
  const [starters, setStarters] = useState<Starter[]>([]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    api<{ starters: Starter[] }>(`/api/hermes/starters?kind=${kind}`)
      .then((data) => setStarters(data.starters ?? []))
      .catch(() => setStarters([]));
  }, [kind]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, role: "user", content: message },
    ]);
    try {
      const result = await api<{
        threadId: string;
        reply: string;
        proposal?: HermesProposal;
        toolsUsed: string[];
        provider: "deepseek" | "local";
        messages: HermesChatMessage[];
      }>("/api/hermes/chat", {
        method: "POST",
        body: JSON.stringify({ message, kind, threadId, current, campaignId }),
      });
      setThreadId(result.threadId);
      setProvider(result.provider);
      setMessages(result.messages);
      if (result.proposal && result.proposal.kind !== "none") {
        onProposal(result.proposal);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Hermes could not complete that turn.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <div className="text-[15px] font-semibold tracking-[-0.02em]">Hermes</div>
          <div className="text-[11px] text-faint">Orchestrator</div>
        </div>
        <Badge tone={provider === "deepseek" ? "good" : provider === "local" ? "warn" : "neutral"}>
          {provider === "deepseek" ? "DeepSeek" : provider === "local" ? "Local harness" : "Ready"}
        </Badge>
      </div>

      <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
        {messages.length === 0 ? (
          <div>
            <p className="text-sm leading-6 text-muted">
              Tell Hermes the goal. It will draft the {kind}, drop it on the canvas, and wait for you to edit.
            </p>
            {starters.length ? (
              <div className="mt-4 space-y-2">
                {starters.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => send(item.body)}
                    className="block w-full rounded-[12px] bg-[#f2f2f7] px-3 py-2.5 text-left text-[12px] leading-5 text-ink hover:bg-[#e8e8ed]"
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{item.body}</div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className={item.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block max-w-[92%] rounded-[16px] px-3.5 py-2 text-[13px] leading-6 ${
                  item.role === "user" ? "bg-accent text-white" : "bg-[#f7f7f8] text-ink"
                }`}
              >
                {item.role === "user" ? item.content : <Markdown text={item.content} />}
              </div>
              {item.toolsUsed?.length ? (
                <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-faint">
                  {item.toolsUsed.join(" · ")}
                </div>
              ) : null}
            </div>
          ))
        )}
        {busy ? <div className="text-xs text-muted">Hermes is harnessing DeepSeek…</div> : null}
        <div ref={end} />
      </div>

      <form
        className="border-t border-line p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <textarea
          className="field min-h-20"
          placeholder={kind === "campaign" ? "Describe the campaign…" : "Describe the sequence…"}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={busy || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
