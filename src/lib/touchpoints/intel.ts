type LeadLike = {
  firstName?: string | null;
  fullName?: string | null;
  company?: { name?: string | null } | null;
  industry?: string | null;
  x?: string | null;
  youtube?: string | null;
};

export type ChannelIntel = {
  source: "x" | "youtube";
  handle: string;
  sapien: string;
  context: string;
  simulated: true;
};

const TWEETS = [
  "weekend fry special just dropped",
  "line out the door for the spicy bird",
  "new brine recipe this week",
  "closed Monday, extra oil Tuesday",
  "hiring a closer for the night window",
];

const VIDEOS = [
  "How we fry 200 birds before lunch",
  "Behind the counter at {{company}}",
  "Our Saturday rush, uncut",
  "Why the batter has to rest overnight",
  "A day in the shop with the owner",
];

export function gatherTwitterIntel(lead: LeadLike): ChannelIntel {
  const company = lead.company?.name || "the shop";
  const handle = lead.x || `https://x.com/${slug(company)}`;
  const tweet = pick(TWEETS);
  return {
    source: "x",
    handle,
    sapien: `${company} recently posted about “${tweet}”.`,
    context: `Twitter check (simulated). ${lead.firstName || "The owner"} is active around store hours. Latest public post mentions ${tweet}.`,
    simulated: true,
  };
}

export function gatherYoutubeIntel(lead: LeadLike): ChannelIntel {
  const company = lead.company?.name || "the shop";
  const handle = lead.youtube || `https://youtube.com/@${slug(company)}`;
  const video = pick(VIDEOS).replace("{{company}}", company);
  return {
    source: "youtube",
    handle,
    sapien: `New YouTube intel: “${video}” — ${company} is leaning into craft and volume.`,
    context: `YouTube check (simulated). Latest public video is “${video}”. Useful hook for a WhatsApp note.`,
    simulated: true,
  };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "shop";
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
