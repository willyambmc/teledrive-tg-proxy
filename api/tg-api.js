// TeleDrive — Telegram API JSON Proxy (Vercel Edge Function)
// Meneruskan semua panggilan JSON ke Telegram Bot API

export const config = {
  runtime: 'edge',
};

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
    const { bot_token, method, proxy_url, proxy_encode } = payload;
    const params = payload.params || {};

    if (!bot_token || !method) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan method diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target berdasarkan proxy_encode mode
    let tgUrl;
    const proxy = (proxy_url || '').trim();
    const encode = proxy_encode || 'false';
    const targetUrl = 'https://api.telegram.org/bot' + bot_token + '/' + method;
    if (proxy) {
      if (encode === 'cors') {
        tgUrl = (proxy.endsWith('/') ? proxy : proxy + '/') + targetUrl;
      } else if (encode === 'true') {
        tgUrl = proxy + encodeURIComponent(targetUrl);
      } else {
        tgUrl = (proxy.endsWith('/') ? proxy : proxy + '/') + targetUrl.replace('https://api.telegram.org/', '');
      }
    } else {
      tgUrl = targetUrl;
    }

    // CORS proxies (proxy.cors.sh) only support GET — use query params instead of POST body
    let fetchOpts;
    if (encode === 'cors' && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
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

    let data;
    try {
      data = await tgResp.json();
    } catch {
      data = { ok: false, description: 'Invalid response from Telegram' };
    }

    return new Response(JSON.stringify(data), {
      status: tgResp.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'API proxy error';
    return new Response(
      JSON.stringify({ ok: false, description: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}