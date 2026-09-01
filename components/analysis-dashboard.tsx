'use client';

import {
  ArrowUpRight,
  Bot,
  Check,
  CircleAlert,
  Database,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import type { AnalysisResult } from '@/lib/analysis-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AnalysisDashboardProps = {
  analysis: AnalysisResult;
  onReset: () => void;
};

function hostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function ProviderCard({ icon: Icon, label, detail, status }: { icon: typeof Globe2; label: string; detail: string; status: 'live' | 'failed' | 'not_configured' }) {
  const live = status === 'live';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#dfe4dc] bg-white p-4 shadow-sm">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${live ? 'bg-[#e8f3e6] text-[#417452]' : 'bg-[#f4f0e7] text-[#8c7240]'}`}><Icon className="size-[18px]" /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="mt-0.5 truncate text-xs text-[#748078]">{detail}</p></div>
      <Badge className={live ? 'bg-[#eaf5e8] text-[#3e744d]' : 'bg-[#f7f0df] text-[#886b31]'} variant="secondary">{live ? 'Live' : status === 'not_configured' ? 'Needs key' : 'Unavailable'}</Badge>
    </div>
  );
}

export function AnalysisDashboard({ analysis, onReset }: AnalysisDashboardProps) {
  return (
    <main className="min-h-screen bg-[#f5f6f1] text-[#1d2925]">
      <header className="sticky top-0 z-30 border-b border-[#dde3db] bg-[#fbfcf8]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-[#18392b] text-white"><TrendingUp className="size-5" /></span><span className="text-lg font-semibold tracking-[-0.04em] text-[#173329]">LocalLift</span></div>
          <div className="flex items-center gap-2"><Badge className={analysis.mode === 'live' ? 'bg-[#eaf5e8] text-[#3e744d]' : 'bg-[#f7f0df] text-[#886b31]'} variant="secondary"><span className={`size-1.5 rounded-full ${analysis.mode === 'live' ? 'bg-[#53a06f]' : 'bg-[#b68a39]'}`} /> {analysis.mode === 'live' ? 'Fully live analysis' : 'Partial live analysis'}</Badge><Button onClick={onReset} size="sm" variant="outline"><RefreshCw /> New analysis</Button></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="text-sm font-medium text-[#66746d]">Live marketing snapshot</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[#193128] sm:text-4xl">{analysis.input.businessName}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7871]">{analysis.summary}</p></div>
          <div className="flex flex-wrap gap-2 text-xs text-[#65736c]"><Badge variant="outline"><Globe2 /> {hostname(analysis.input.website)}</Badge><Badge variant="outline"><MapPin /> {analysis.input.serviceAreas.split(',')[0]}</Badge><Badge variant="outline"><Target /> {analysis.input.services.split(',')[0]}</Badge></div>
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-3">
          <ProviderCard detail={`${analysis.crawl.pages.length} public page${analysis.crawl.pages.length === 1 ? '' : 's'} crawled`} icon={Globe2} label="Website evidence" status={analysis.crawl.status} />
          <ProviderCard detail={analysis.search.provider !== 'none' ? `Live verified sources · “${analysis.search.query}”` : analysis.search.error ?? 'Search provider unavailable'} icon={Search} label="Local search evidence" status={analysis.search.status} />
          <ProviderCard detail={analysis.ai.status === 'live' ? `${analysis.ai.model} structured analysis` : analysis.ai.status === 'not_configured' ? 'Add a free GROQ_API_KEY to enable' : analysis.ai.error ?? 'AI request failed'} icon={Bot} label="AI synthesis" status={analysis.ai.status} />
        </section>

        {analysis.ai.status !== 'live' ? <section className="mt-4 flex items-start gap-3 rounded-xl border border-[#e2d5b8] bg-[#fbf6e9] px-5 py-4"><CircleAlert className="mt-0.5 size-5 shrink-0 text-[#9a7631]" /><div><p className="text-sm font-semibold text-[#72551e]">AI is not being simulated</p><p className="mt-1 text-xs leading-5 text-[#806b42]">The website crawl is live. Recommendations use transparent rules until a free Groq API key is configured on the server; Browser Search and structured AI synthesis then run together.</p></div></section> : null}

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card className="border-[#dfe4dc] bg-white py-0 shadow-sm ring-0">
            <CardHeader className="border-b border-[#e5e9e3] px-5 py-5 sm:px-6"><CardTitle className="text-lg font-semibold">Evidence-backed priorities</CardTitle><CardDescription>Each recommendation links back to a crawled page or live search result.</CardDescription></CardHeader>
            <CardContent className="divide-y divide-[#e9ece7] px-0">
              {analysis.priorities.map((priority, index) => <article className="flex gap-4 px-5 py-5 sm:px-6" key={`${priority.title}-${index}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${priority.impact === 'high' ? 'bg-[#fff0e8] text-[#b86547]' : priority.impact === 'medium' ? 'bg-[#f8f1d7] text-[#94742f]' : 'bg-[#e8f0f4] text-[#4e7385]'}`}><span className="text-sm font-bold">{index + 1}</span></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{priority.title}</h2><Badge className="capitalize" variant="outline">{priority.impact}</Badge></div><p className="mt-1.5 text-sm leading-6 text-[#65736c]">{priority.why}</p><div className="mt-3 space-y-2">{(priority.evidence ?? []).slice(0, 3).map((item) => <a className="block rounded-lg bg-[#f0f3ee] px-3 py-2 text-xs leading-5 text-[#52675a] hover:bg-[#e5ebe2]" href={item.url} key={`${item.url}-${item.quote}`} rel="noreferrer" target="_blank"><span className="font-semibold">“{item.quote}”</span><span className="mt-1 flex items-center gap-1 text-[11px] text-[#76847b]">{hostname(item.url)} <ArrowUpRight className="size-3" /></span></a>)}</div></div></article>)}
            </CardContent>
          </Card>

          <Card className="border-[#dfe4dc] bg-[#19392c] py-0 text-white shadow-xl ring-0">
            <CardHeader className="px-6 pt-6"><span className="mb-3 grid size-10 place-items-center rounded-xl bg-white/10 text-[#d5efad]"><ShieldCheck className="size-5" /></span><CardTitle className="text-lg font-semibold text-white">Evidence readiness</CardTitle><CardDescription className="text-white/55">MVP signal score · not a full SEO score</CardDescription></CardHeader>
            <CardContent className="px-6 pb-6"><div className="flex items-end gap-3"><span className="text-7xl font-semibold tracking-[-0.07em]">{Math.round(analysis.readinessScore)}</span><span className="mb-3 text-sm text-white/55">/ 75</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#cbe998]" style={{ width: `${(analysis.readinessScore / 75) * 100}%` }} /></div><div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-xs">{(analysis.scoreBreakdown ?? []).map((item) => <div className="flex justify-between gap-4" key={item.label}><span className="text-white/55">{item.label}</span><span className="font-semibold">{item.points}/{item.maxPoints}</span></div>)}</div></CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <Card className="border-[#dfe4dc] bg-white py-0 shadow-sm ring-0"><CardHeader className="border-b border-[#e5e9e3] px-5 py-5 sm:px-6"><CardTitle className="text-lg font-semibold">Verified web evidence</CardTitle><CardDescription>Query: “{analysis.search.query}” · Every source was opened and checked for local relevance</CardDescription></CardHeader><CardContent className="px-0">{analysis.search.results.length ? <div className="divide-y divide-[#edf0eb]">{analysis.search.results.slice(0, 6).map((result) => <a className="flex items-start gap-3 px-5 py-4 transition hover:bg-[#fafbf8] sm:px-6" href={result.link} key={`${result.position}-${result.link}`} rel="noreferrer" target="_blank"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#eef2eb] text-xs font-bold text-[#59705f]">{result.position}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{result.title}</span><span className="mt-1 line-clamp-2 text-xs leading-5 text-[#7b8780]">{result.snippet}</span><span className="mt-1 block truncate text-[11px] text-[#91a097]">{hostname(result.link)} · verified</span></span><ArrowUpRight className="mt-1 size-4 shrink-0 text-[#8f9a94]" /></a>)}</div> : <div className="px-6 py-12 text-center"><Database className="mx-auto size-7 text-[#9aa49e]" /><p className="mt-3 text-sm font-semibold">No verified local sources available</p><p className="mt-1 text-xs text-[#7e8983]">Search candidates that fail access or local relevance checks are excluded.</p></div>}</CardContent></Card>

          <Card className="border-[#dfe4dc] bg-white py-0 shadow-sm ring-0"><CardHeader className="border-b border-[#e5e9e3] px-5 py-5 sm:px-6"><Badge className="mb-2 bg-[#e7eee3] text-[#315a45]" variant="secondary"><Sparkles /> {analysis.ai.status === 'live' ? 'AI-generated brief' : 'Rule-generated brief'}</Badge><CardTitle className="text-lg font-semibold">{analysis.contentBrief.title}</CardTitle><CardDescription>Primary keyword: {analysis.contentBrief.primaryKeyword}</CardDescription></CardHeader><CardContent className="px-5 py-5 sm:px-6"><div className="rounded-lg bg-[#f1f4ef] px-3 py-2.5 text-xs font-semibold text-[#58705f]">{analysis.contentBrief.searchIntent}</div><ol className="mt-4 space-y-2">{analysis.contentBrief.outline.map((item, index) => <li className="flex gap-3 rounded-lg border border-[#e6eae4] px-3 py-2.5 text-sm leading-5" key={item}><span className="font-semibold text-[#66806f]">{index + 1}</span>{item}</li>)}</ol><p className="mt-4 flex items-center gap-1.5 text-xs text-[#7b8780]"><Check className="size-3.5 text-[#578267]" /> Human approval required before publishing</p></CardContent></Card>
        </section>

        <Card className="mt-5 border-[#dfe4dc] bg-white py-0 shadow-sm ring-0"><CardHeader className="border-b border-[#e5e9e3] px-5 py-5 sm:px-6"><CardTitle className="text-lg font-semibold">Crawled website pages</CardTitle><CardDescription>Live page-level signals used by the analysis</CardDescription></CardHeader><CardContent className="grid gap-3 px-5 py-5 md:grid-cols-2 sm:px-6">{analysis.crawl.pages.length ? analysis.crawl.pages.map((page) => <a className="rounded-xl border border-[#e1e6df] p-4 transition hover:border-[#bfcdbf] hover:bg-[#fafbf8]" href={page.url} key={page.url} rel="noreferrer" target="_blank"><div className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{page.title || 'Missing page title'}</span><span className="mt-1 block truncate text-xs text-[#7b8780]">{page.url}</span></span><ArrowUpRight className="size-4 shrink-0 text-[#89958e]" /></div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{page.wordCount} words</Badge><Badge className={page.description ? 'bg-[#eaf5e8] text-[#3e744d]' : 'bg-[#faece8] text-[#a75a46]'} variant="secondary">{page.description ? 'Description found' : 'Description missing'}</Badge><Badge className={page.hasLocalBusinessSchema ? 'bg-[#eaf5e8] text-[#3e744d]' : 'bg-[#f3f1eb] text-[#756f61]'} variant="secondary">{page.hasLocalBusinessSchema ? 'Local schema' : 'No local schema'}</Badge></div></a>) : <div className="col-span-full py-8 text-center text-sm text-[#7d8982]">{analysis.crawl.error ?? 'The website could not be crawled.'}</div>}</CardContent></Card>
      </div>
    </main>
  );
}
