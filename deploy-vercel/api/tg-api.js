// TeleDrive — Telegram API JSON Proxy (Vercel Edge Function)
// Meneruskan semua panggilan JSON ke Telegram Bot API

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS preflight
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
    const { bot_token, method, proxy_url } = payload;
    const params = payload.params || {};

    if (!bot_token || !method) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan method diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target
    let tgUrl;
    const proxy = (proxy_url || '').trim();
    if (proxy) {
      const base = proxy.endsWith('/') ? proxy : proxy + '/';
      tgUrl = base + 'bot' + bot_token + '/' + method;
    } else {
      tgUrl = 'https://api.telegram.org/bot' + bot_token + '/' + method;
    }

    const tgResp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30000),
    });

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