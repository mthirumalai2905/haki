"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SequenceNav } from "@/components/sequence/SequenceNav";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { SEQUENCE_TEMPLATES, templateChannels, templateSteps } from "@/lib/sequence/templates";
import { writeSequenceSeed } from "@/lib/sequence/seed";
import { defaultWorkflow } from "@/lib/workflow/defaults";
import { useRouter } from "next/navigation";

export default function SequencesPage() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    api<{ id: string }[]>("/api/workflows")
      .then((items) => setCount(items.length))
      .catch(() => setCount(0));
  }, []);

  function blank() {
    writeSequenceSeed({ name: "Untitled sequence", workflow: defaultWorkflow() });
    router.push("/sequences/builder");
  }

  return (
    <AppShell
      title="Templates"
      subtitle="Pick a sequence. Preview it. Then open the builder."
      actions={<SequenceNav libraryCount={count} />}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-xl text-sm text-muted">
          Each card is a full path. Open it on its own page. The builder is a separate page.
        </p>
        <Button variant="secondary" size="sm" onClick={blank}>
          Blank sequence
        </Button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-3">
        {SEQUENCE_TEMPLATES.map((item) => {
          const channels = templateChannels(item.workflow);
          const steps = templateSteps(item.workflow);
          return (
            <Link
              key={item.id}
              href={`/sequences/${item.id}`}
              className="rounded-[16px] border border-line bg-white px-4 py-4 text-left shadow-[0_8px_20px_rgba(29,29,31,0.04)] hover:border-accent/40 hover:shadow-[0_12px_28px_rgba(0,122,255,0.08)]"
            >
              <div className="text-[15px] font-semibold tracking-[-0.022em]">{item.name}</div>
              <div className="mt-1 text-[13px] text-muted">{item.blurb}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {steps.slice(0, 5).map((step) => (
                  <span key={step.id} className="rounded-full bg-paper px-2 py-0.5 text-[10px] text-muted">
                    {step.data.label}
                  </span>
                ))}
                {steps.length > 5 ? <span className="text-[10px] text-faint">+{steps.length - 5}</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {channels.map((channel) => (
                  <Badge key={channel} tone="info">
                    {channel}
                  </Badge>
                ))}
                <Badge tone="neutral">{steps.length} steps</Badge>
              </div>
              <div className="mt-3 text-[12px] leading-snug text-faint">{item.how}</div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
