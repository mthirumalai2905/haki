"use client";

import { AppShell } from "@/components/layout/AppShell";
import { HermesStudio } from "@/components/hermes/HermesStudio";

export default function NewCampaignPage() {
  return (
    <AppShell title="Create campaign" subtitle="Ask Hermes, then drag the workflow into place.">
      <HermesStudio kind="campaign" />
    </AppShell>
  );
}
