import type { CrawledPage, SearchResult } from './analysis-types';

const BLOCKED_HOSTS = new Set(['localhost', 'localhost.localdomain', '0.0.0.0', '::1']);

function isPrivateIpv4(hostname: string) {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const [, aText, bText] = match;
  const a = Number(aText);
  const b = Number(bText);
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function validatePublicUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS websites are supported.');
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || isPrivateIpv4(hostname)) {
    throw new Error('Private or local network addresses are not allowed.');
  }
  url.hash = '';
  return url;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function firstMatch(html: string, pattern: RegExp) {
  return decodeHtml(html.match(pattern)?.[1]?.replace(/<[^>]+>/g, ' ') ?? '');
}

function visibleText(html: string) {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' '));
}

export function parsePage(url: string, html: string): CrawledPage {
  const text = visibleText(html);

  return {
    url,
    title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i),
    h1: firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
    excerpt: text.slice(0, 1_600),
    wordCount: text ? text.split(/\s+/).length : 0,
    hasLocalBusinessSchema: /LocalBusiness|Plumber|Electrician|RoofingContractor|HVACBusiness/i.test(html),
  };
}

function sameOriginLinks(baseUrl: URL, html: string) {
  const links: string[] = [];
  const hrefPattern = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefPattern.exec(html)) && links.length < 12) {
    try {
      const candidate = new URL(match[1], baseUrl);
      if (candidate.origin !== baseUrl.origin || !['http:', 'https:'].includes(candidate.protocol)) continue;
      candidate.hash = '';
      const normalized = candidate.toString();
      if (!links.includes(normalized) && normalized !== baseUrl.toString()) links.push(normalized);
    } catch {
      // Ignore malformed links discovered in third-party HTML.
    }
  }
  return links;
}

export async function fetchHtml(url: URL) {
  return (await fetchHtmlDocument(url)).html;
}

async function fetchHtmlDocument(url: URL) {
  const pageProxy = process.env.PAGE_PROXY_URL?.replace(/\/$/, '');
  const endpoint = pageProxy ? `${pageProxy}/page?url=${encodeURIComponent(url.href)}` : url;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'LocalLift-MVP/0.1 (+website marketing audit)',
      ...(pageProxy ? { 'X-LocalLift-Proxy': 'development' } : {}),
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(10_000),
  });
  const finalUrl = validatePublicUrl(response.headers.get('x-locallift-final-url') || response.url || url.toString());
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}.`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) throw new Error('The website did not return an HTML page.');
  return { html: (await response.text()).slice(0, 350_000), finalUrl };
}

function looksLikeBlockedOrErrorPage(page: CrawledPage, html: string) {
  const sample = `${page.title} ${page.h1} ${page.excerpt}`.toLowerCase();
  return page.wordCount < 80
    || /just a moment|verify you are human|attention required|access denied|cf-chl-|captcha/.test(`${sample} ${html.slice(0, 20_000).toLowerCase()}`)
    || /\b404\b|page not found|not found \|/.test(sample);
}

export async function verifySearchSources(candidates: SearchResult[], location: string) {
  const locationToken = location.split(',')[0]?.trim().toLowerCase();
  const verified: SearchResult[] = [];
  const inspectCandidate = async (candidate: SearchResult) => {
    try {
      const requestedUrl = validatePublicUrl(candidate.link);
      const { html, finalUrl } = await fetchHtmlDocument(requestedUrl);
      const page = parsePage(finalUrl.toString(), html);
      if (looksLikeBlockedOrErrorPage(page, html)) return;
      const searchable = `${page.url} ${page.title} ${page.h1} ${page.description}`.toLowerCase();
      if (locationToken && !searchable.includes(locationToken)) return;
      verified.push({
        ...candidate,
        title: page.title || page.h1 || candidate.title,
        link: page.url,
        snippet: page.description || page.excerpt.slice(0, 220),
        excerpt: page.excerpt,
        status: 'verified' as const,
      });
    } catch {
      // Unavailable candidates are intentionally excluded from the evidence set.
    }
  };

  const queue = candidates.slice(0, 8);
  for (let index = 0; index < queue.length && verified.length < 5; index += 2) {
    await Promise.all(queue.slice(index, index + 2).map(inspectCandidate));
  }

  return verified
    .map((source, index): SearchResult => ({ ...source, position: index + 1 }));
}

export async function crawlWebsite(rawUrl: string) {
  const startUrl = validatePublicUrl(rawUrl);
  const homeHtml = await fetchHtml(startUrl);
  const pages = [parsePage(startUrl.toString(), homeHtml)];
  const discovered = sameOriginLinks(startUrl, homeHtml).slice(0, 4);

  const discoveredPages = await Promise.all(discovered.map(async (discoveredUrl) => {
    try {
      const url = validatePublicUrl(discoveredUrl);
      const html = await fetchHtml(url);
      return parsePage(url.toString(), html);
    } catch {
      return null;
    }
  }));
  pages.push(...discoveredPages.filter((page): page is CrawledPage => page !== null));

  return pages;
}
