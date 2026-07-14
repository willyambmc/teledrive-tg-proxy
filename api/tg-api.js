// TeleDrive — Telegram API JSON Proxy (Vercel Edge Function)
// Meneruskan semua panggilan JSON ke Telegram Bot API

export const config = {
  runtime: 'edge',
};

function buildProxyUrl(proxy, proxyEncode, telegramUrl) {
  if (proxyEncode === 'cors') {
    var base = proxy.endsWith('/') ? proxy : proxy + '/';
    return base + telegramUrl;
  } else if (proxyEncode === 'true') {
    return proxy + encodeURIComponent(telegramUrl);
  } else {
    var base = proxy.endsWith('/') ? proxy : proxy + '/';
    return base + telegramUrl.replace('https://api.telegram.org/', '');
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, description: 'Hanya POST yang diizinkan' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const payload = await req.json();
    const bot_token = payload.bot_token;
    const method = payload.method;
    const proxy_url = (payload.proxy_url || '').trim();
    const proxy_encode = payload.proxy_encode || 'false';
    const params = payload.params || {};

    if (!bot_token || !method) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan method diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target berdasarkan proxy_encode mode
    const targetUrl = 'https://api.telegram.org/bot' + bot_token + '/' + method;
    var tgUrl;
    if (proxy_url) {
      tgUrl = buildProxyUrl(proxy_url, proxy_encode, targetUrl);
    } else {
      tgUrl = targetUrl;
    }

    // CORS proxies (proxy.cors.sh) only support GET — use query params instead of POST body
    var fetchOpts;
    if (proxy_encode === 'cors' && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(
        Object.entries(params).map(function(entry) {
          var k = entry[0], v = entry[1];
          return [k, typeof v === 'object' ? JSON.stringify(v) : String(v)];
        })
      ).toString();
      tgUrl += (tgUrl.includes('?') ? '&' : '?') + qs;
      fetchOpts = { method: 'GET', signal: AbortSignal.timeout(30000) };
    } else {
      fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(30000),
      };
    }

    const tgResp = await fetch(tgUrl, fetchOpts);

    var data;
    try {
      data = await tgResp.json();
    } catch (e) {
      data = { ok: false, description: 'Invalid response from Telegram' };
    }

    return new Response(JSON.stringify(data), {
      status: tgResp.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    var msg = error instanceof Error ? error.message : 'API proxy error';
    return new Response(
      JSON.stringify({ ok: false, description: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}