"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SequenceWorkspace } from "@/components/sequence/SequenceWorkspace";

export default function SequencesPage() {
  return (
    <AppShell
      flush
      title="Sequences"
      subtitle="Start from a template. Preview the path. Edit before you save."
    >
      <SequenceWorkspace />
    </AppShell>
  );
}
