export type NewsItem = {
  headline: string;
  source: string;
  publishedAt: string;
  summary: string;
};

export type NewsProvider = {
  searchBusiness(query: { company: string; industry?: string | null; website?: string | null }): Promise<NewsItem[]>;
};

export type ScriptGenerator = {
  write(input: {
    company: string;
    contact?: string | null;
    news: NewsItem[];
  }): Promise<string>;
};

export type VideoRenderer = {
  render(input: { script: string; company: string; jobId: string }): Promise<{ videoUrl: string }>;
};

export type VideoPipeline = {
  newsProvider: NewsProvider;
  scriptGenerator: ScriptGenerator;
  videoRenderer: VideoRenderer;
};
