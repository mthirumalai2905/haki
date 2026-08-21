import { ai } from "../ai";
import type { NewsItem, NewsProvider, ScriptGenerator, VideoPipeline, VideoRenderer } from "./types";

export const mockNewsProvider: NewsProvider = {
  async searchBusiness({ company, industry }) {
    const topic = industry || "the market";
    return [
      {
        headline: `${company} expands operations`,
        source: "simulation-wire",
        publishedAt: new Date().toISOString(),
        summary: `Simulated news: ${company} is investing in ${topic}. This is not a scraped listing and not a real wire story.`,
      },
      {
        headline: `${company} names a near-term priority`,
        source: "simulation-desk",
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        summary: `Operators at ${company} are focused on ${topic}. Context is generated for review, not claimed as a live fetch.`,
      },
    ];
  },
};

export const deepSeekScriptGenerator: ScriptGenerator = {
  async write({ company, contact, news }) {
    const lines = news.map((item) => `${item.headline}: ${item.summary}`).join("\n");
    const drafted = await ai.generateMessage({
      company,
      channel: "email",
      goal: "start_conversations",
      lead: { fullName: contact, company: { name: company } },
    });
    return [
      `This presenter video is only about ${company}.`,
      contact ? `It addresses ${contact}.` : "",
      `Recent context: ${lines}`,
      drafted.body,
    ]
      .filter(Boolean)
      .join("\n\n");
  },
};

export const mockVideoRenderer: VideoRenderer = {
  async render({ script, company, jobId }) {
    return {
      videoUrl: `/api/video/jobs/${jobId}/file?sim=1&company=${encodeURIComponent(company)}&lines=${encodeURIComponent(String(script.length))}`,
    };
  },
};

export const defaultVideoPipeline: VideoPipeline = {
  newsProvider: mockNewsProvider,
  scriptGenerator: deepSeekScriptGenerator,
  videoRenderer: mockVideoRenderer,
};

export async function runVideoPipeline(
  pipeline: VideoPipeline,
  input: { company: string; contact?: string | null; industry?: string | null; website?: string | null; jobId: string },
) {
  const news = await pipeline.newsProvider.searchBusiness({
    company: input.company,
    industry: input.industry,
    website: input.website,
  });
  const script = await pipeline.scriptGenerator.write({
    company: input.company,
    contact: input.contact,
    news,
  });
  const rendered = await pipeline.videoRenderer.render({ script, company: input.company, jobId: input.jobId });
  return { news, script, videoUrl: rendered.videoUrl };
}
