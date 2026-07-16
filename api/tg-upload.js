// TeleDrive — Telegram File Upload Proxy (Vercel Edge Function)
// Menerima multipart dari browser, meneruskan ke Telegram Bot API

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (req.method === 'OPTIONS') {
    corsHeaders['Access-Control-Max-Age'] = '86400';
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, description: 'Hanya POST yang diizinkan' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    var formData = await req.formData();

    var botToken = formData.get('bot_token') || '';
    var chatId = formData.get('chat_id') || '';
    var caption = formData.get('caption') || '';
    var proxyUrl = (formData.get('proxy_url') || '').trim();
    var proxyEncode = (formData.get('proxy_encode') || '').trim() || 'false';
    var file = formData.get('document');

    if (!botToken || !chatId) {
      return new Response(JSON.stringify({ ok: false, description: 'bot_token dan chat_id diperlukan' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, description: 'Tidak ada file yang diupload' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Bangun URL target
    var targetUrl = 'https://api.telegram.org/bot' + encodeURIComponent(botToken) + '/sendDocument';
    var tgUrl;
    if (proxyUrl) {
      tgUrl = buildProxyUrl(proxyUrl, proxyEncode, targetUrl);
    } else {
      tgUrl = targetUrl;
    }

    // Bangun FormData baru untuk Telegram
    var outgoing = new FormData();
    outgoing.append('chat_id', chatId);
    outgoing.append('document', file, file.name);
    if (caption) outgoing.append('caption', caption);

    var resp;
    try {
      resp = await fetch(tgUrl, {
        method: 'POST',
        body: outgoing,
        signal: AbortSignal.timeout(300000),
      });
    } catch (fetchErr) {
      return new Response(JSON.stringify({ ok: false, description: 'Gagal menghubungi proxy: ' + (fetchErr.message || 'Network error') }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    var data;
    try {
      data = await resp.json();
    } catch (e) {
      data = {
        ok: false,
        description: 'Proxy tidak merespon JSON (status ' + resp.status + '). Pastikan proxy aktif dan URL benar.'
      };
    }

    return new Response(JSON.stringify(data), {
      status: data.ok ? 200 : (resp.status >= 400 ? resp.status : 200),
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    var msg = error instanceof Error ? error.message : 'Upload proxy error';
    return new Response(JSON.stringify({ ok: false, description: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}