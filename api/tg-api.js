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
    var payload = await req.json();
    var bot_token = payload.bot_token;
    var method = payload.method;
    var proxy_url = (payload.proxy_url || '').trim();
    var proxy_encode = payload.proxy_encode || 'false';
    var params = payload.params || {};

    if (!bot_token || !method) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan method diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target berdasarkan proxy_encode mode
    var targetUrl = 'https://api.telegram.org/bot' + encodeURIComponent(bot_token) + '/' + encodeURIComponent(method);
    var tgUrl;
    if (proxy_url) {
      tgUrl = buildProxyUrl(proxy_url, proxy_encode, targetUrl);
    } else {
      tgUrl = targetUrl;
    }

    // CORS proxies (proxy.cors.sh) only support GET — use query params instead of POST body
    var fetchOpts;
    if (proxy_encode === 'cors' && Object.keys(params).length > 0) {
      var qs = new URLSearchParams();
      for (var k in params) {
        var v = params[k];
        qs.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
      tgUrl += (tgUrl.includes('?') ? '&' : '?') + qs.toString();
      fetchOpts = { method: 'GET', signal: AbortSignal.timeout(30000) };
    } else {
      fetchOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(30000),
      };
    }

    var tgResp;
    try {
      tgResp = await fetch(tgUrl, fetchOpts);
    } catch (fetchErr) {
      return new Response(
        JSON.stringify({ ok: false, description: 'Gagal menghubungi proxy: ' + (fetchErr.message || 'Network error') }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    var data;
    try {
      data = await tgResp.json();
    } catch (e) {
      data = {
        ok: false,
        description: 'Proxy tidak merespon JSON (status ' + tgResp.status + '). Pastikan proxy aktif dan URL benar.'
      };
    }

    return new Response(JSON.stringify(data), {
      status: data.ok ? 200 : (tgResp.status >= 400 ? tgResp.status : 200),
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