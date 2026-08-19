import { db } from "./db";
import { recordActivity } from "./activity";
import { fallbackQualify } from "./ai/fallback";
import { defaultWorkflow } from "./workflow/defaults";

export const SEED_VERSION = "fried-v1";

type DummyLead = {
  company: string;
  website: string;
  first: string;
  last: string;
  title: string;
  email: string;
  phone?: string;
  linkedin?: string;
  whatsapp?: string;
  reddit?: string;
  x?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  googleWorkspace?: string;
  industry: string;
  country: string;
  size: string;
  city?: string;
};

const SAMPLE_LEADS: DummyLead[] = [
  {
    company: "Crisp & Co",
    website: "https://crispandco.demo",
    first: "Marcus",
    last: "Bell",
    title: "Owner",
    email: "hello@crispandco.demo",
    phone: "+1 615 555 0142",
    linkedin: "https://linkedin.com/company/crisp-and-co-demo",
    whatsapp: "+16155550142",
    x: "https://x.com/crispandco",
    instagram: "https://instagram.com/crispandco",
    youtube: "https://youtube.com/@crispandco",
    tiktok: "https://tiktok.com/@crispandco",
    reddit: "https://reddit.com/user/crispandco",
    googleWorkspace: "https://business.google.com/crispandco",
    industry: "Fried chicken",
    country: "United States",
    size: "2-10",
    city: "Nashville",
  },
  {
    company: "Golden Batter",
    website: "https://goldenbatter.demo",
    first: "Keisha",
    last: "Ward",
    title: "Owner",
    email: "orders@goldenbatter.demo",
    phone: "+1 404 555 0188",
    linkedin: "https://linkedin.com/company/golden-batter-demo",
    whatsapp: "+14045550188",
    x: "https://x.com/goldenbatter",
    instagram: "https://instagram.com/goldenbatter",
    tiktok: "https://tiktok.com/@goldenbatter",
    youtube: "https://youtube.com/@goldenbatter",
    googleWorkspace: "https://business.google.com/goldenbatter",
    industry: "Fried chicken",
    country: "United States",
    size: "11-50",
    city: "Atlanta",
  },
  {
    company: "Harbor Fish Fry",
    website: "https://harborfishfry.demo",
    first: "Owen",
    last: "McRae",
    title: "Operator",
    email: "info@harborfishfry.demo",
    phone: "+1 617 555 0133",
    linkedin: "https://linkedin.com/company/harbor-fish-fry-demo",
    whatsapp: "+16175550133",
    instagram: "https://instagram.com/harborfishfry",
    x: "https://x.com/harborfishfry",
    reddit: "https://reddit.com/user/harborfishfry",
    googleWorkspace: "https://business.google.com/harborfishfry",
    industry: "Fish fry",
    country: "United States",
    size: "2-10",
    city: "Boston",
  },
  {
    company: "Southern Skillet",
    website: "https://southernskillet.demo",
    first: "Tanya",
    last: "Brooks",
    title: "Owner",
    email: "hello@southernskillet.demo",
    phone: "+1 713 555 0177",
    linkedin: "https://linkedin.com/company/southern-skillet-demo",
    whatsapp: "+17135550177",
    instagram: "https://instagram.com/southernskillet",
    tiktok: "https://tiktok.com/@southernskillet",
    youtube: "https://youtube.com/@southernskillet",
    x: "https://x.com/southskillet",
    googleWorkspace: "https://business.google.com/southernskillet",
    industry: "Fried chicken",
    country: "United States",
    size: "11-50",
    city: "Houston",
  },
  {
    company: "Lotus Fry Bar",
    website: "https://lotusfrybar.demo",
    first: "Min",
    last: "Park",
    title: "Owner",
    email: "hello@lotusfrybar.demo",
    phone: "+1 213 555 0110",
    linkedin: "https://linkedin.com/company/lotus-fry-bar-demo",
    whatsapp: "+12135550110",
    instagram: "https://instagram.com/lotusfrybar",
    tiktok: "https://tiktok.com/@lotusfrybar",
    youtube: "https://youtube.com/@lotusfrybar",
    x: "https://x.com/lotusfrybar",
    googleWorkspace: "https://business.google.com/lotusfrybar",
    industry: "Korean fried chicken",
    country: "United States",
    size: "11-50",
    city: "Los Angeles",
  },
  {
    company: "Barrel & Fry",
    website: "https://barrelandfry.demo",
    first: "Cody",
    last: "Hayes",
    title: "Owner",
    email: "eat@barrelandfry.demo",
    phone: "+1 512 555 0190",
    linkedin: "https://linkedin.com/company/barrel-and-fry-demo",
    whatsapp: "+15125550190",
    instagram: "https://instagram.com/barrelandfry",
    tiktok: "https://tiktok.com/@barrelandfry",
    reddit: "https://reddit.com/user/barrelandfry",
    googleWorkspace: "https://business.google.com/barrelandfry",
    industry: "Fried chicken",
    country: "United States",
    size: "2-10",
    city: "Austin",
  },
  {
    company: "Midnight Wings",
    website: "https://midnightwings.demo",
    first: "Alicia",
    last: "Grant",
    title: "Operator",
    email: "night@midnightwings.demo",
    phone: "+1 312 555 0164",
    linkedin: "https://linkedin.com/company/midnight-wings-demo",
    whatsapp: "+13125550164",
    instagram: "https://instagram.com/midnightwings",
    tiktok: "https://tiktok.com/@midnightwings",
    youtube: "https://youtube.com/@midnightwings",
    x: "https://x.com/midnightwings",
    googleWorkspace: "https://business.google.com/midnightwings",
    industry: "Wings",
    country: "United States",
    size: "11-50",
    city: "Chicago",
  },
  {
    company: "The Fry Counter",
    website: "https://thefrycounter.demo",
    first: "Luis",
    last: "Vega",
    title: "Owner",
    email: "counter@thefrycounter.demo",
    phone: "+1 718 555 0122",
    linkedin: "https://linkedin.com/company/the-fry-counter-demo",
    whatsapp: "+17185550122",
    instagram: "https://instagram.com/thefrycounter",
    tiktok: "https://tiktok.com/@thefrycounter",
    googleWorkspace: "https://business.google.com/thefrycounter",
    industry: "Fries & sides",
    country: "United States",
    size: "2-10",
    city: "Brooklyn",
  },
  {
    company: "Iron Skillet",
    website: "https://ironskillet.demo",
    first: "Dana",
    last: "Cole",
    title: "Owner",
    email: "hello@ironskillet.demo",
    phone: "+1 313 555 0155",
    linkedin: "https://linkedin.com/company/iron-skillet-demo",
    whatsapp: "+13135550155",
    instagram: "https://instagram.com/ironskillet",
    x: "https://x.com/ironskillet",
    youtube: "https://youtube.com/@ironskillet",
    googleWorkspace: "https://business.google.com/ironskillet",
    industry: "Fried chicken",
    country: "United States",
    size: "11-50",
    city: "Detroit",
  },
  {
    company: "Citrus Fry Co",
    website: "https://citrusfryco.demo",
    first: "Camila",
    last: "Ruiz",
    title: "Owner",
    email: "hola@citrusfryco.demo",
    phone: "+1 305 555 0148",
    linkedin: "https://linkedin.com/company/citrus-fry-co-demo",
    whatsapp: "+13055550148",
    instagram: "https://instagram.com/citrusfryco",
    tiktok: "https://tiktok.com/@citrusfryco",
    youtube: "https://youtube.com/@citrusfryco",
    x: "https://x.com/citrusfryco",
    googleWorkspace: "https://business.google.com/citrusfryco",
    industry: "Fried seafood",
    country: "United States",
    size: "2-10",
    city: "Miami",
  },
  {
    company: "Maple Drumstick",
    website: "https://mapledrumstick.demo",
    first: "Noah",
    last: "Lind",
    title: "Owner",
    email: "hello@mapledrumstick.demo",
    phone: "+1 612 555 0199",
    linkedin: "https://linkedin.com/company/maple-drumstick-demo",
    whatsapp: "+16125550199",
    instagram: "https://instagram.com/mapledrumstick",
    reddit: "https://reddit.com/user/mapledrumstick",
    googleWorkspace: "https://business.google.com/mapledrumstick",
    industry: "Fried chicken",
    country: "United States",
    size: "2-10",
    city: "Minneapolis",
  },
  {
    company: "Red Basket",
    website: "https://redbasket.demo",
    first: "Priya",
    last: "Nair",
    title: "Operator",
    email: "eat@redbasket.demo",
    phone: "+1 816 555 0171",
    linkedin: "https://linkedin.com/company/red-basket-demo",
    whatsapp: "+18165550171",
    instagram: "https://instagram.com/redbasket",
    tiktok: "https://tiktok.com/@redbasket",
    youtube: "https://youtube.com/@redbasket",
    googleWorkspace: "https://business.google.com/redbasket",
    industry: "Fried chicken",
    country: "United States",
    size: "11-50",
    city: "Kansas City",
  },
  {
    company: "Smoke & Batter",
    website: "https://smokeandbatter.demo",
    first: "Jerome",
    last: "Hale",
    title: "Owner",
    email: "pit@smokeandbatter.demo",
    phone: "+1 901 555 0128",
    linkedin: "https://linkedin.com/company/smoke-and-batter-demo",
    whatsapp: "+19015550128",
    instagram: "https://instagram.com/smokeandbatter",
    tiktok: "https://tiktok.com/@smokeandbatter",
    x: "https://x.com/smokeandbatter",
    youtube: "https://youtube.com/@smokeandbatter",
    googleWorkspace: "https://business.google.com/smokeandbatter",
    industry: "Fried chicken",
    country: "United States",
    size: "11-50",
    city: "Memphis",
  },
  {
    company: "Dockside Fry",
    website: "https://docksidefry.demo",
    first: "Elena",
    last: "Cho",
    title: "Owner",
    email: "hello@docksidefry.demo",
    phone: "+1 206 555 0182",
    linkedin: "https://linkedin.com/company/dockside-fry-demo",
    whatsapp: "+12065550182",
    instagram: "https://instagram.com/docksidefry",
    reddit: "https://reddit.com/user/docksidefry",
    googleWorkspace: "https://business.google.com/docksidefry",
    industry: "Fish fry",
    country: "United States",
    size: "2-10",
    city: "Seattle",
  },
  {
    company: "Chili Crisp Shop",
    website: "https://chilicrispshop.demo",
    first: "Wei",
    last: "Tan",
    title: "Owner",
    email: "heat@chilicrispshop.demo",
    phone: "+1 503 555 0119",
    linkedin: "https://linkedin.com/company/chili-crisp-shop-demo",
    whatsapp: "+15035550119",
    instagram: "https://instagram.com/chilicrispshop",
    tiktok: "https://tiktok.com/@chilicrispshop",
    youtube: "https://youtube.com/@chilicrispshop",
    x: "https://x.com/chilicrispshop",
    googleWorkspace: "https://business.google.com/chilicrispshop",
    industry: "Fried snacks",
    country: "United States",
    size: "2-10",
    city: "Portland",
  },
  {
    company: "Bird & Basket",
    website: "https://birdandbasket.demo",
    first: "Andre",
    last: "Sims",
    title: "Owner",
    email: "hello@birdandbasket.demo",
    phone: "+1 214 555 0160",
    linkedin: "https://linkedin.com/company/bird-and-basket-demo",
    whatsapp: "+12145550160",
    instagram: "https://instagram.com/birdandbasket",
    tiktok: "https://tiktok.com/@birdandbasket",
    youtube: "https://youtube.com/@birdandbasket",
    googleWorkspace: "https://business.google.com/birdandbasket",
    industry: "Fried chicken",
    country: "United States",
    size: "11-50",
    city: "Dallas",
  },
  {
    company: "Saltline Fry",
    website: "https://saltlinefry.demo",
    first: "Renee",
    last: "Baptiste",
    title: "Owner",
    email: "hello@saltlinefry.demo",
    phone: "+1 504 555 0144",
    linkedin: "https://linkedin.com/company/saltline-fry-demo",
    whatsapp: "+15045550144",
    instagram: "https://instagram.com/saltlinefry",
    tiktok: "https://tiktok.com/@saltlinefry",
    x: "https://x.com/saltlinefry",
    reddit: "https://reddit.com/user/saltlinefry",
    googleWorkspace: "https://business.google.com/saltlinefry",
    industry: "Fried seafood",
    country: "United States",
    size: "2-10",
    city: "New Orleans",
  },
  {
    company: "Pilon Fry House",
    website: "https://pilonfryhouse.demo",
    first: "Sofia",
    last: "Mendez",
    title: "Owner",
    email: "casa@pilonfryhouse.demo",
    phone: "+1 787 555 0136",
    linkedin: "https://linkedin.com/company/pilon-fry-house-demo",
    whatsapp: "+17875550136",
    instagram: "https://instagram.com/pilonfryhouse",
    tiktok: "https://tiktok.com/@pilonfryhouse",
    youtube: "https://youtube.com/@pilonfryhouse",
    googleWorkspace: "https://business.google.com/pilonfryhouse",
    industry: "Fried plantains & chicken",
    country: "United States",
    size: "2-10",
    city: "San Juan",
  },
];

const DEFAULT_ICP = {
  name: "Independent fried shops",
  industry: "Fried chicken",
  companySize: "2-50",
  location: "United States",
  jobTitle: "Owner / Operator",
  description: "Independent fried chicken, fish fry, and wing shops with an owner on site.",
};

export async function ensureDummyData(workspaceId: string) {
  const leads = await db.lead.findMany({
    where: { workspaceId },
    select: { source: true, customFields: true },
  });
  const onlySample = leads.every((lead) => lead.source === "sample");
  const currentVersion = leads.some((lead) => lead.customFields.includes(SEED_VERSION));
  if (leads.length >= SAMPLE_LEADS.length && onlySample && currentVersion) {
    return { created: 0, seeded: false };
  }
  if (leads.length === 0 || onlySample) {
    return seedSampleData(workspaceId, leads.length > 0);
  }
  return { created: 0, seeded: false };
}

export async function seedSampleData(workspaceId: string, force = false) {
  if (force) {
    await db.activity.deleteMany({ where: { workspaceId } });
    await db.campaign.deleteMany({ where: { workspaceId } });
    await db.lead.deleteMany({ where: { workspaceId, source: "sample" } });
    await db.company.deleteMany({
      where: { workspaceId, leads: { none: {} } },
    });
  } else {
    const existing = await db.lead.count({ where: { workspaceId } });
    if (existing > 0) return { created: 0, seeded: false };
  }

  let created = 0;
  for (const row of SAMPLE_LEADS) {
    const company = await db.company.upsert({
      where: { workspaceId_name: { workspaceId, name: row.company } },
      create: {
        workspaceId,
        name: row.company,
        website: row.website,
        domain: row.website.replace(/^https?:\/\//, ""),
        industry: row.industry,
        country: row.country,
        city: row.city,
        companySize: row.size,
        linkedin: row.linkedin,
        x: row.x,
      },
      update: {
        website: row.website,
        industry: row.industry,
        country: row.country,
        city: row.city,
        companySize: row.size,
      },
    });

    const lead = await db.lead.create({
      data: {
        workspaceId,
        companyId: company.id,
        firstName: row.first,
        lastName: row.last,
        fullName: `${row.first} ${row.last}`,
        jobTitle: row.title,
        email: row.email,
        phone: row.phone,
        linkedin: row.linkedin,
        whatsapp: row.whatsapp,
        reddit: row.reddit,
        x: row.x,
        instagram: row.instagram,
        youtube: row.youtube,
        tiktok: row.tiktok,
        googleWorkspace: row.googleWorkspace,
        website: row.website,
        industry: row.industry,
        country: row.country,
        companySize: row.size,
        source: "sample",
        emailValid: true,
        phoneValid: Boolean(row.phone),
        customFields: JSON.stringify({
          city: row.city ?? "",
          demo: "true",
          seed: SEED_VERSION,
        }),
      },
    });

    const qualification = fallbackQualify(
      {
        firstName: row.first,
        lastName: row.last,
        fullName: `${row.first} ${row.last}`,
        jobTitle: row.title,
        email: row.email,
        industry: row.industry,
        country: row.country,
        companySize: row.size,
        company: { name: row.company, industry: row.industry, companySize: row.size },
      },
      DEFAULT_ICP,
    );

    await db.qualification.create({
      data: {
        leadId: lead.id,
        score: qualification.score,
        status: qualification.status,
        reason: qualification.reason,
      },
    });
    await db.lead.update({
      where: { id: lead.id },
      data: { status: qualification.status },
    });

    await recordActivity({
      workspaceId,
      leadId: lead.id,
      action: "lead_imported",
      metadata: { source: "sample" },
    });
    await recordActivity({
      workspaceId,
      leadId: lead.id,
      action: "lead_qualified",
      metadata: qualification,
    });

    created += 1;
  }

  await db.icp.deleteMany({ where: { workspaceId } });
  await db.icp.create({
    data: { workspaceId, ...DEFAULT_ICP },
  });

  const workflow = defaultWorkflow();
  await db.campaign.create({
    data: {
      workspaceId,
      name: "Fried shop outreach",
      description: "Dummy campaign for independent fried businesses.",
      goal: "book_meetings",
      audience: JSON.stringify({ type: "all", count: created }),
      channels: JSON.stringify(["email", "whatsapp", "instagram"]),
      status: "draft",
      workflowVersions: {
        create: {
          version: 1,
          nodes: JSON.stringify(workflow.nodes),
          edges: JSON.stringify(workflow.edges),
          isActive: true,
        },
      },
      messages: {
        create: workflow.nodes
          .filter((node) => node.data.channel)
          .map((node) => ({
            nodeId: node.id,
            channel: node.data.channel || "email",
            subject: node.data.subject,
            body: node.data.body || "",
          })),
      },
    },
  });

  return { created, seeded: true };
}
