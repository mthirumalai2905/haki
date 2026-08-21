"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SequenceNav } from "@/components/sequence/SequenceNav";
import { HermesStudio } from "@/components/hermes/HermesStudio";
import { cloneWorkflow, getSequenceTemplate } from "@/lib/sequence/templates";
import { readSequenceSeed } from "@/lib/sequence/seed";
import { defaultWorkflow } from "@/lib/workflow/defaults";
import type { WorkflowGraph } from "@/lib/types";

export default function SequenceBuilderPage() {
  return (
    <Suspense fallback={<AppShell title="Builder" subtitle="Loading." />}>
      <BuilderInner />
    </Suspense>
  );
}

function BuilderInner() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState<{ name: string; workflow: WorkflowGraph }>({
    name: "Untitled sequence",
    workflow: defaultWorkflow(),
  });

  useEffect(() => {
    const from = params.get("template");
    const blank = params.get("blank") === "1";
    const stored = readSequenceSeed();
    if (from) {
      const template = getSequenceTemplate(from);
      if (template) {
        setSeed({ name: template.name, workflow: cloneWorkflow(template.workflow) });
        setReady(true);
        return;
      }
    }
    if (!blank && stored?.workflow) {
      setSeed(stored);
      setReady(true);
      return;
    }
    setSeed({ name: "Untitled sequence", workflow: defaultWorkflow() });
    setReady(true);
  }, [params]);

  return (
    <AppShell
      flush
      title="Builder"
      subtitle="Chat and canvas. Templates stay on their own page."
      actions={<SequenceNav />}
    >
      <div className="h-full min-h-0 p-6">
        {ready ? (
          <HermesStudio key={seed.name} kind="sequence" seedName={seed.name} seedWorkflow={seed.workflow} />
        ) : null}
      </div>
    </AppShell>
  );
}
