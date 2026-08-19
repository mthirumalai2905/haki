import type { ChannelId } from "../types";

export type ChannelResult = {
  ok: boolean;
  simulated: boolean;
  provider: string;
  message?: string;
};

export type ChannelProvider = {
  id: ChannelId;
  label: string;
  implemented: boolean;
  send: (input: {
    to?: string | null;
    subject?: string | null;
    body?: string | null;
  }) => Promise<ChannelResult>;
};

function simulated(id: ChannelId, label: string): ChannelProvider {
  return {
    id,
    label,
    implemented: true,
    async send() {
      return {
        ok: true,
        simulated: true,
        provider: "simulation",
        message: `${label} action simulated`,
      };
    },
  };
}

function comingSoon(id: ChannelId, label: string): ChannelProvider {
  return {
    id,
    label,
    implemented: false,
    async send() {
      return {
        ok: false,
        simulated: true,
        provider: "unavailable",
        message: `${label} is coming soon`,
      };
    },
  };
}

const registry: Record<string, ChannelProvider> = {
  email: simulated("email", "Email"),
  sms: simulated("sms", "SMS"),
  phone: simulated("phone", "Phone"),
  linkedin: simulated("linkedin", "LinkedIn"),
  whatsapp: simulated("whatsapp", "WhatsApp"),
  x: simulated("x", "X"),
  reddit: simulated("reddit", "Reddit"),
  instagram: comingSoon("instagram", "Instagram"),
  youtube: comingSoon("youtube", "YouTube"),
};

export function getChannel(id?: string | null) {
  if (!id) return null;
  return registry[id] ?? null;
}

export function listChannels() {
  return Object.values(registry);
}
