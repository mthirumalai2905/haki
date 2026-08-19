"use client";

import { AppShell } from "@/components/layout/AppShell";
import { UniversalHome } from "@/components/universal/UniversalHome";

export default function UniversalPage() {
  return (
    <AppShell flush title="Haki Universal" subtitle="Beta. Watch the plan. Watch the count.">
      <UniversalHome />
    </AppShell>
  );
}
