import http from 'node:http';

const host = '127.0.0.1';
const port = 8788;
const upstream = 'https://api.groq.com/openai/v1/chat/completions';

function publicUrl(rawUrl) {
  const url = new URL(rawUrl);
  const hostname = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol)
    || ['localhost', '0.0.0.0', '::1'].includes(hostname)
    || hostname.endsWith('.local')
    || /^(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(hostname)) {
    throw new Error('Only public HTTP websites are allowed.');
  }
  return url;
}

const server = http.createServer(async (request, response) => {
  if (request.headers['x-locallift-proxy'] !== 'development') {
    response.writeHead(404).end();
    return;
  }

  try {
    if (request.method === 'GET' && request.url?.startsWith('/search?')) {
      const query = new URL(request.url, `http://${host}:${port}`).searchParams.get('q') ?? '';
      const searchResponse = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' },
      });
      response.writeHead(searchResponse.status, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(Buffer.from(await searchResponse.arrayBuffer()));
      return;
    }
    if (request.method === 'GET' && request.url?.startsWith('/page?')) {
      const requestedUrl = publicUrl(new URL(request.url, `http://${host}:${port}`).searchParams.get('url') ?? '');
      const pageResponse = await fetch(requestedUrl, {
        headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'LocalLift-MVP/0.2 (+evidence verification)' },
        redirect: 'follow',
      });
      const finalUrl = publicUrl(pageResponse.url || requestedUrl.href);
      response.writeHead(pageResponse.status, {
        'Content-Type': pageResponse.headers.get('content-type') ?? 'application/octet-stream',
        'X-LocalLift-Final-URL': finalUrl.href,
      });
      response.end(Buffer.from(await pageResponse.arrayBuffer()));
      return;
    }
    if (request.method !== 'POST' || request.url !== '/openai/v1/chat/completions') {
      response.writeHead(404).end();
      return;
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 1_000_000) throw new Error('Request is too large.');
      chunks.push(chunk);
    }
    const upstreamResponse = await fetch(upstream, {
      method: 'POST',
      headers: {
        Authorization: request.headers.authorization ?? '',
        'Content-Type': 'application/json',
      },
      body: Buffer.concat(chunks),
    });
    response.writeHead(upstreamResponse.status, { 'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json' });
    response.end(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch (error) {
    response.writeHead(502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: { message: error instanceof Error ? error.message : 'Local proxy failed.' } }));
  }
});

server.listen(port, host, () => console.log(`LocalLift development proxy ready on http://${host}:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
