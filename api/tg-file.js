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
  var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method === 'OPTIONS') {
    corsHeaders['Access-Control-Max-Age'] = '86400';
    return new Response(null, { headers: corsHeaders });
  }

  try {
    var url = new URL(req.url);
    var botToken = url.searchParams.get('bot_token');
    var filePath = url.searchParams.get('file_path');
    var proxyUrl = (url.searchParams.get('proxy_url') || '').trim();
    var proxyEncode = url.searchParams.get('proxy_encode') || 'false';
    var isDownload = url.searchParams.get('download') === '1';
    var filename = url.searchParams.get('filename') || '';

    if (!botToken || !filePath) {
      return new Response(JSON.stringify({ ok: false, description: 'bot_token dan file_path diperlukan' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Bangun URL target Telegram
    var targetUrl = 'https://api.telegram.org/file/bot' + encodeURIComponent(botToken) + '/' + encodeURIComponent(filePath);
    var tgUrl;
    if (proxyUrl) {
      tgUrl = buildProxyUrl(proxyUrl, proxyEncode, targetUrl);
    } else {
      tgUrl = targetUrl;
    }

    // Fetch file dari Telegram/proxy
    var tgResp;
    try {
      tgResp = await fetch(tgUrl, { signal: AbortSignal.timeout(120000) });
    } catch (fetchErr) {
      return new Response(JSON.stringify({ ok: false, description: 'Gagal mengambil file: ' + (fetchErr.message || 'Network error') }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!tgResp.ok) {
      return new Response(JSON.stringify({ ok: false, description: 'Gagal mengambil file (status ' + tgResp.status + ')' }), {
        status: tgResp.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Tentukan Content-Type
    var contentType = tgResp.headers.get('Content-Type') || 'application/octet-stream';

    // Bangun response headers
    var headers = {
      'Content-Type': contentType,
      ...corsHeaders,
      'Cache-Control': 'private, max-age=3600',
    };

    // Jika download, tambahkan Content-Disposition
    if (isDownload && filename) {
      headers['Content-Disposition'] = 'attachment; filename="' + filename.replace(/"/g, '') + '"';
    }

    // Stream file ke browser
    return new Response(tgResp.body, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    var msg = error instanceof Error ? error.message : 'File proxy error';
    return new Response(JSON.stringify({ ok: false, description: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}