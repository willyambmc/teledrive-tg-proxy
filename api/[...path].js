export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  const url = new URL(req.url);
  const pathOnly = url.pathname.replace(/^\/api\/?/, '');
  if (!pathOnly) {
    return new Response(
      'OK TeleDrive Proxy aktif. URL: ' + url.origin + '/api/',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
  const targetUrl = 'https://api.telegram.org/' + pathOnly + url.search;
  const headers = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) headers.set('Content-Type', ct);
  try {
    const opts = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') opts.body = req.body;
    const resp = await fetch(targetUrl, opts);
    const h = new Headers(resp.headers);
    h.set('Access-Control-Allow-Origin', '*');
    h.set('Access-Control-Allow-Headers', '*');
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, description: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
