// TeleDrive — Telegram File Proxy (Vercel Edge Function)
// Mengambil file dari Telegram dan mengirim ke browser

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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, description: 'Hanya GET yang diizinkan' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const url = new URL(req.url);
    const botToken = url.searchParams.get('bot_token');
    const filePath = url.searchParams.get('file_path');
    const proxyUrl = (url.searchParams.get('proxy_url') || '').trim();
    const proxyEncode = url.searchParams.get('proxy_encode') || 'false';
    const isDownload = url.searchParams.get('download') === '1';
    const filename = url.searchParams.get('filename') || '';

    if (!botToken || !filePath) {
      return new Response(JSON.stringify({ ok: false, description: 'bot_token dan file_path diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Bangun URL target Telegram berdasarkan proxy_encode mode
    const targetUrl = 'https://api.telegram.org/file/bot' + botToken + '/' + filePath;
    var tgUrl;
    if (proxyUrl) {
      tgUrl = buildProxyUrl(proxyUrl, proxyEncode, targetUrl);
    } else {
      tgUrl = targetUrl;
    }

    // Fetch file dari Telegram
    const tgResp = await fetch(tgUrl, {
      signal: AbortSignal.timeout(120000),
    });

    if (!tgResp.ok) {
      return new Response(JSON.stringify({ ok: false, description: 'Gagal mengambil file dari Telegram: ' + tgResp.status }), {
        status: tgResp.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Tentukan Content-Type
    const contentType = tgResp.headers.get('Content-Type') || 'application/octet-stream';

    // Bangun response headers
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'private, max-age=3600',
    };

    // Jika download, tambahkan Content-Disposition
    if (isDownload && filename) {
      headers['Content-Disposition'] = 'attachment; filename="' + filename.replace(/"/g, '') + '"';
    }

    // Stream file ke browser
    return new Response(tgResp.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    var msg = error instanceof Error ? error.message : 'File proxy error';
    return new Response(
      JSON.stringify({ ok: false, description: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}