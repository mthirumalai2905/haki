"use client";

import { AppShell } from "@/components/layout/AppShell";
import { HakiHome } from "@/components/haki/HakiHome";

export default function HakiPage() {
  return (
    <AppShell flush title="Haki AI" subtitle="Chat first. Preview the file when you ask.">
      <HakiHome />
    </AppShell>
  );
}
