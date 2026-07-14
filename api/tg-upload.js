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
    const formData = await req.formData();

    const botToken = formData.get('bot_token') || '';
    const chatId = formData.get('chat_id') || '';
    const caption = formData.get('caption') || '';
    const proxyUrl = (formData.get('proxy_url') || '').trim();
    const proxyEncode = (formData.get('proxy_encode') || '').trim() || 'false';
    const file = formData.get('document');

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan chat_id diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ ok: false, description: 'Tidak ada file yang diupload' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target berdasarkan proxy_encode mode
    const targetUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
    var tgUrl;
    if (proxyUrl) {
      tgUrl = buildProxyUrl(proxyUrl, proxyEncode, targetUrl);
    } else {
      tgUrl = targetUrl;
    }

    // Bangun FormData baru untuk Telegram
    const outgoing = new FormData();
    outgoing.append('chat_id', chatId);
    outgoing.append('document', file, file.name);
    if (caption) outgoing.append('caption', caption);

    const resp = await fetch(tgUrl, {
      method: 'POST',
      body: outgoing,
    });

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    var msg = error instanceof Error ? error.message : 'Upload proxy error';
    return new Response(
      JSON.stringify({ ok: false, description: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}