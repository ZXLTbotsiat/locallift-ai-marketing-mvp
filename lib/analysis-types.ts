export type BusinessInput = {
  businessName: string;
  category: string;
  website: string;
  serviceAreas: string;
  services: string;
};

export type CrawledPage = {
  url: string;
  title: string;
  description: string;
  h1: string;
  excerpt: string;
  wordCount: number;
  hasLocalBusinessSchema: boolean;
};

export type SearchResult = {
  position: number;
  title: string;
  link: string;
  snippet: string;
  excerpt: string;
  status: 'candidate' | 'verified';
  source: 'duckduckgo-html' | 'groq-browser-search';
};

export type Evidence = {
  url: string;
  quote: string;
};

export type Priority = {
  title: string;
  why: string;
  impact: 'high' | 'medium' | 'low';
  evidence: Evidence[];
};

export type ScoreItem = {
  label: string;
  points: number;
  maxPoints: number;
};

export type ContentBrief = {
  title: string;
  primaryKeyword: string;
  searchIntent: string;
  outline: string[];
};

export type AnalysisResult = {
  mode: 'live' | 'partial';
  generatedAt: string;
  input: BusinessInput;
  readinessScore: number;
  scoreBreakdown: ScoreItem[];
  summary: string;
  crawl: {
    status: 'live' | 'failed';
    pages: CrawledPage[];
    error?: string;
  };
  search: {
    status: 'live' | 'failed' | 'not_configured';
    provider: 'duckduckgo-html' | 'groq-browser-search' | 'hybrid' | 'none';
    query: string;
    results: SearchResult[];
    error?: string;
  };
  ai: {
    status: 'live' | 'not_configured' | 'failed';
    provider: 'groq' | 'alibaba-qwen';
    model?: string;
    error?: string;
  };
  priorities: Priority[];
  contentBrief: ContentBrief;
};
