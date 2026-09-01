import type { AnalysisResult, BusinessInput, ContentBrief, Evidence, Priority, ScoreItem } from '@/lib/analysis-types';
import { analyzeWithAi } from '@/lib/groq-analyzer';
import { crawlWebsite } from '@/lib/site-crawler';

function requiredString(value: unknown, name: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required.`);
  return value.trim().slice(0, 500);
}

function deterministicAnalysis(input: BusinessInput, pages: AnalysisResult['crawl']['pages'], searchResults: AnalysisResult['search']['results']) {
  const service = input.services.split(',')[0]?.trim() || input.category;
  const area = input.serviceAreas.split(',')[0]?.trim() || input.serviceAreas;
  const priorities: Priority[] = [];
  const pageEvidence = (page: AnalysisResult['crawl']['pages'][number]): Evidence => ({ url: page.url, quote: page.h1 || page.title || page.excerpt.slice(0, 160) });
  const sourceEvidence = (source: AnalysisResult['search']['results'][number]): Evidence => ({ url: source.link, quote: source.title || source.excerpt.slice(0, 160) });

  const missingDescription = pages.find((page) => !page.description);
  if (missingDescription) priorities.push({ title: 'Add a unique description to the inspected page', why: 'The crawler did not detect a meta description on this page. Add a concise description that matches the visible service promise.', impact: 'medium', evidence: [pageEvidence(missingDescription)] });
  if (pages.length && !pages.some((page) => page.hasLocalBusinessSchema)) priorities.push({ title: 'Add LocalBusiness structured data', why: 'No relevant LocalBusiness schema was detected in the inspected HTML. Validate the business details before adding markup.', impact: 'medium', evidence: pages.slice(0, 2).map(pageEvidence) });
  const serviceGapPage = pages.find((page) => !`${page.title} ${page.h1}`.toLowerCase().includes(service.toLowerCase()));
  if (serviceGapPage) priorities.push({ title: `Clarify the ${service} focus on key pages`, why: `At least one inspected title and primary heading does not clearly name “${service}”.`, impact: 'high', evidence: [pageEvidence(serviceGapPage)] });
  if (searchResults.length) priorities.push({ title: `Compare messaging across verified ${area} sources`, why: `These accessible pages contain local service language that can inform a differentiated, evidence-based page brief. Their order here is not a performance claim.`, impact: 'high', evidence: searchResults.slice(0, 3).map(sourceEvidence) });
  if (pages.length) priorities.push({ title: `Build a monthly ${area} content rhythm`, why: 'Turn questions supported by the inspected pages into one useful page or post each week, with human fact-checking before publication.', impact: 'low', evidence: pages.slice(0, 1).map(pageEvidence) });

  const scoreBreakdown: ScoreItem[] = [
    { label: 'Crawl coverage', points: Math.min(20, pages.length * 4), maxPoints: 20 },
    { label: 'Page fundamentals', points: (pages[0]?.title ? 8 : 0) + (pages[0]?.description ? 8 : 0) + (pages[0]?.h1 ? 4 : 0), maxPoints: 20 },
    { label: 'Local structured data', points: pages.some((page) => page.hasLocalBusinessSchema) ? 15 : 0, maxPoints: 15 },
    { label: 'Service and area signals', points: Math.min(10, pages.filter((page) => `${page.title} ${page.h1} ${page.description}`.toLowerCase().includes(service.toLowerCase())).length * 2), maxPoints: 10 },
    { label: 'Verified local sources', points: Math.min(10, searchResults.length * 2), maxPoints: 10 },
  ];
  const score = scoreBreakdown.reduce((total, item) => total + item.points, 0);
  const contentBrief: ContentBrief = {
    title: `${service.replace(/\b\w/g, (letter) => letter.toUpperCase())} in ${area}`,
    primaryKeyword: `${service} ${area}`.toLowerCase(),
    searchIntent: 'Local service · High purchase intent',
    outline: [`Fast ${service} help for ${area} customers`, 'Common warning signs and when to call', 'Repair, replacement and service options', `Why customers in ${area} choose ${input.businessName}`, 'Service area, availability and next step'],
  };
  return { readinessScore: score, scoreBreakdown, summary: `${input.businessName} was analyzed using ${pages.length} accessible website page${pages.length === 1 ? '' : 's'} and ${searchResults.length} verified local source${searchResults.length === 1 ? '' : 's'}. This is an evidence snapshot, not a complete SEO audit.`, priorities: priorities.slice(0, 5), contentBrief };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json() as Record<string, unknown>;
    const input: BusinessInput = {
      businessName: requiredString(raw.businessName, 'Business name'),
      category: requiredString(raw.category, 'Category'),
      website: requiredString(raw.website, 'Website'),
      serviceAreas: requiredString(raw.serviceAreas, 'Service areas'),
      services: requiredString(raw.services, 'Services'),
    };

    let pages: AnalysisResult['crawl']['pages'] = [];
    let crawlError: string | undefined;
    try { pages = await crawlWebsite(input.website); } catch (error) { crawlError = error instanceof Error ? error.message : 'Website crawl failed.'; }

    const service = input.services.split(',')[0]?.trim() || input.category;
    const area = input.serviceAreas.split(',')[0]?.trim() || input.serviceAreas;
    let query = `${service} ${area}`;
    let searchResults: AnalysisResult['search']['results'] = [];
    let searchProvider: AnalysisResult['search']['provider'] = 'none';
    let searchError: string | undefined;

    const configuredProvider: AnalysisResult['ai']['provider'] = process.env.QWEN_API_KEY && process.env.QWEN_BASE_URL ? 'alibaba-qwen' : 'groq';
    const hasAiKey = configuredProvider === 'alibaba-qwen' || Boolean(process.env.GROQ_API_KEY);
    let aiStatus: AnalysisResult['ai']['status'] = hasAiKey ? 'failed' : 'not_configured';
    let aiModel: string | undefined;
    let aiError: string | undefined;
    let finalAnalysis = deterministicAnalysis(input, pages, searchResults);
    if (hasAiKey) {
      try {
        const ai = await analyzeWithAi(input, pages, query);
        if (ai) {
          aiStatus = 'live'; aiModel = ai.model;
          searchProvider = ai.searchProvider; searchResults = ai.sources; query = ai.query;
          const scored = deterministicAnalysis(input, pages, searchResults);
          finalAnalysis = {
            ...scored,
            priorities: ai.analysis.priorities.length >= 3 ? ai.analysis.priorities : scored.priorities,
            contentBrief: ai.analysis.contentBrief,
          };
        }
      } catch (error) {
        aiError = error instanceof Error ? error.message : 'Groq analysis failed.';
        searchError = aiError;
      }
    }

    const result: AnalysisResult = {
      mode: pages.length > 0 && searchResults.length > 0 && aiStatus === 'live' ? 'live' : 'partial',
      generatedAt: new Date().toISOString(), input,
      crawl: { status: pages.length ? 'live' : 'failed', pages, ...(crawlError ? { error: crawlError } : {}) },
      search: { status: searchResults.length ? 'live' : hasAiKey ? 'failed' : 'not_configured', provider: searchProvider, query, results: searchResults, ...(searchError ? { error: searchError } : {}) },
      ai: { status: aiStatus, provider: configuredProvider, ...(aiModel ? { model: aiModel } : {}), ...(aiError ? { error: aiError } : {}) },
      ...finalAnalysis,
    };
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Analysis failed.' }, { status: 400 });
  }
}
