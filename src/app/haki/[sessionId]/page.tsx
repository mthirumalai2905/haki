"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { HakiHome } from "@/components/haki/HakiHome";

export default function HakiSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <AppShell flush title="Haki AI" subtitle="Chat first. Preview the file when you ask.">
      <HakiHome sessionId={typeof sessionId === "string" ? sessionId : undefined} />
    </AppShell>
  );
}
