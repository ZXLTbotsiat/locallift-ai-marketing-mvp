'use client';

import { SyntheticEvent, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  CircleAlert,
  Database,
  Globe2,
  Link2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import type { AnalysisResult } from '@/lib/analysis-types';

const analysisSteps = [
  'Crawling website pages and technical signals',
  'Mapping services to local search demand',
  'Comparing nearby competitors and content coverage',
  'Building a prioritized marketing plan',
];

const sources = [
  {
    icon: Globe2,
    title: 'Business website',
    description: 'Pages, titles, schema, services, locations and technical SEO signals.',
    access: 'Public crawl',
  },
  {
    icon: MapPin,
    title: 'Google Business Profile',
    description: 'Categories, reviews, posts, hours and business information.',
    access: 'Google OAuth',
  },
  {
    icon: Database,
    title: 'Local search data',
    description: 'Grounded web sources, nearby competitors and local content coverage.',
    access: 'Groq Browser Search',
  },
  {
    icon: Bot,
    title: 'AI synthesis',
    description: 'Turns verified signals into priorities, briefs and draft content.',
    access: 'Human approval',
  },
];

type SetupScreenProps = {
  onComplete: (analysis: AnalysisResult) => void;
};

export function SetupScreen({ onComplete }: SetupScreenProps) {
  const [connected, setConnected] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  async function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setError('');
    setProgress(0);
    setAnalyzing(true);
    const form = new FormData(event.currentTarget);
    const progressTimer = window.setInterval(() => setProgress((current) => Math.min(current + 3, 88)), 180);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.get('businessName'),
          category: form.get('category'),
          website: form.get('website'),
          serviceAreas: form.get('serviceAreas'),
          services: form.get('services'),
        }),
      });
      const payload = await response.json() as AnalysisResult | { error?: string };
      if (!response.ok || 'error' in payload) throw new Error('error' in payload ? payload.error || 'Analysis failed.' : 'Analysis failed.');
      window.clearInterval(progressTimer);
      setProgress(100);
      window.setTimeout(() => onComplete(payload as AnalysisResult), 300);
    } catch (requestError) {
      window.clearInterval(progressTimer);
      setAnalyzing(false);
      setError(requestError instanceof Error ? requestError.message : 'Analysis failed.');
    }
  }

  const currentStep = Math.min(Math.floor(progress / 25), analysisSteps.length - 1);

  return (
    <main className="min-h-screen bg-[#f5f6f1] text-[#1d2925]">
      <header className="border-b border-[#dde3db] bg-[#fbfcf8]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#18392b] text-white">
              <TrendingUp className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-[-0.04em] text-[#173329]">LocalLift</span>
          </div>
          <Badge className="bg-[#edf2e8] text-[#315a45]" variant="secondary">
            Interactive MVP
          </Badge>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,1.08fr)] lg:gap-14 lg:py-14">
        <section className="lg:pt-3">
          <Badge className="bg-[#e5eddf] text-[#315a45]" variant="secondary">
            <Sparkles /> Start with your real business
          </Badge>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-[#193128] sm:text-5xl">
            Turn your online presence into a clear marketing plan.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#63716a]">
            Tell LocalLift about the business. We combine the website, Google profile and local search data, then explain what to fix and what content to create next.
          </p>

          <div className="mt-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f8b84]">
              How the analysis works
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {sources.map((source, index) => (
                <article className="rounded-xl border border-[#dce3da] bg-white p-4 shadow-[0_2px_10px_rgb(24_57_43/3%)]" key={source.title}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-[#edf2e8] text-[#426452]">
                      <source.icon className="size-[17px]" />
                    </span>
                    <span className="text-xs font-semibold text-[#9aa39e]">0{index + 1}</span>
                  </div>
                  <h2 className="mt-3 text-sm font-semibold">{source.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#728078]">{source.description}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#50705e]">
                    <ShieldCheck className="size-3.5" /> {source.access}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="self-start overflow-hidden rounded-2xl border border-[#d9e0d8] bg-white shadow-[0_24px_70px_rgb(23_51_41/9%)]">
          {analyzing ? (
            <div className="flex min-h-[650px] flex-col justify-center px-6 py-10 sm:px-10">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e7eee3] text-[#315a45]">
                <Search className="size-7 animate-pulse" />
              </span>
              <h2 className="mt-6 text-center text-2xl font-semibold tracking-[-0.035em]">Building your first marketing snapshot</h2>
              <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-[#6f7c75]">
                This demo is crawling the public website, checking grounded web sources and building a structured AI analysis.
              </p>
              <div className="mx-auto mt-8 w-full max-w-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#405248]">{analysisSteps[currentStep]}</span>
                  <span className="font-semibold text-[#41644f]">{progress}%</span>
                </div>
                <Progress className="mt-3 [&_[data-slot=progress-indicator]]:bg-[#4b7c60] [&_[data-slot=progress-track]]:h-2" value={progress} />
                <div className="mt-7 space-y-3">
                  {analysisSteps.map((step, index) => (
                    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${index <= currentStep ? 'bg-[#f2f5ef] text-[#30483b]' : 'text-[#9aa49e]'}`} key={step}>
                      <span className={`grid size-6 place-items-center rounded-full ${index < currentStep ? 'bg-[#5b936c] text-white' : index === currentStep ? 'border-2 border-[#6a9178] bg-white' : 'border border-[#dce2dc]'}`}>
                        {index < currentStep ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="border-b border-[#e4e8e2] px-6 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#edf2e8] text-[#41614f]"><Building2 className="size-5" /></span>
                  <div><h2 className="text-lg font-semibold tracking-[-0.025em]">Set up your business</h2><p className="text-sm text-[#78847d]">About two minutes · You can edit this later</p></div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><input className="h-10 w-full rounded-lg border border-[#dce2dc] bg-[#fbfcfa] px-3 text-sm outline-none transition focus:border-[#6a8877] focus:ring-2 focus:ring-[#d4e0d8]" defaultValue="Roto-Rooter" id="business-name" name="businessName" required /></div>
                  <div className="space-y-2"><Label htmlFor="category">Primary category</Label><input className="h-10 w-full rounded-lg border border-[#dce2dc] bg-[#fbfcfa] px-3 text-sm outline-none transition focus:border-[#6a8877] focus:ring-2 focus:ring-[#d4e0d8]" defaultValue="Plumbing service" id="category" name="category" required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="website">Business website</Label><div className="relative"><Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87938c]" /><input className="h-10 w-full rounded-lg border border-[#dce2dc] bg-[#fbfcfa] pl-9 pr-3 text-sm outline-none transition focus:border-[#6a8877] focus:ring-2 focus:ring-[#d4e0d8]" defaultValue="https://www.rotorooter.com/" id="website" name="website" required type="url" /></div><p className="text-xs text-[#8a958f]">We crawl public pages only. No website login is required.</p></div>
                <div className="space-y-2"><Label htmlFor="areas">Service areas</Label><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-[#87938c]" /><Textarea className="min-h-20 resize-none bg-[#fbfcfa] pl-9" defaultValue="Provo, Utah" id="areas" name="serviceAreas" required /></div></div>
                <div className="space-y-2"><Label htmlFor="services">Core services</Label><Textarea className="min-h-20 resize-none bg-[#fbfcfa]" defaultValue="Emergency plumbing, drain cleaning, water heater repair, leak detection" id="services" name="services" required /></div>

                {error ? <div className="flex items-start gap-2 rounded-lg border border-[#efc8bd] bg-[#fff2ee] px-3 py-2.5 text-xs leading-5 text-[#9a4f3c]"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</div> : null}

                <div className={`rounded-xl border p-4 transition ${connected ? 'border-[#bcd5c2] bg-[#f0f7ef]' : 'border-[#dce2dc] bg-[#fafbf9]'}`}>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-lg ${connected ? 'bg-[#5d956e] text-white' : 'bg-white text-[#5b7465] shadow-sm'}`}>{connected ? <Check className="size-4" strokeWidth={3} /> : <Link2 className="size-4" />}</span><div><p className="text-sm font-semibold">Google Business Profile</p><p className="mt-0.5 text-xs text-[#758179]">Optional for the demo; OAuth in production</p></div></div>
                    <Button onClick={() => setConnected((current) => !current)} size="sm" type="button" variant={connected ? 'secondary' : 'outline'}>{connected ? 'Connected' : 'Connect profile'}</Button>
                  </div>
                </div>
              </div>

              <footer className="flex flex-col-reverse justify-between gap-3 border-t border-[#e4e8e2] bg-[#fafbf9] px-6 py-5 sm:flex-row sm:items-center sm:px-8">
                <p className="flex items-center gap-1.5 text-xs text-[#758179]"><ShieldCheck className="size-3.5" /> Credentials are encrypted and never sent to the AI model.</p>
                <Button className="h-10 bg-[#18392b] px-4 text-white hover:bg-[#26503b]" type="submit">Analyze this business <ArrowRight /></Button>
              </footer>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
