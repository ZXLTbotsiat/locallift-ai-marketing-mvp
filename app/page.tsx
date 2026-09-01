'use client';

import { useState } from 'react';

import type { AnalysisResult } from '@/lib/analysis-types';
import { AnalysisDashboard } from '@/components/analysis-dashboard';
import { SetupScreen } from '@/components/setup-screen';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  if (!analysis) return <SetupScreen onComplete={setAnalysis} />;

  return <AnalysisDashboard analysis={analysis} onReset={() => setAnalysis(null)} />;
}
