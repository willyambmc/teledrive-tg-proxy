// TeleDrive — Telegram File Upload Proxy (Vercel Edge Function)
// Menerima multipart dari browser, meneruskan ke Telegram Bot API

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
    const formData = await req.formData();

    const botToken = formData.get('bot_token') as string;
    const chatId = formData.get('chat_id') as string;
    const caption = (formData.get('caption') as string) || '';
    const proxyUrl = (formData.get('proxy_url') as string) || '';
    const proxyEncode = (formData.get('proxy_encode') as string) || 'false';
    const file = formData.get('document') as File | null;

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan chat_id diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!file) {
      return new Response(
        JSON.stringify({ ok: false, description: 'Tidak ada file yang diupload' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target berdasarkan proxy_encode mode
    let tgUrl;
    const targetUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
    if (proxyUrl) {
      if (proxyEncode === 'cors') {
        tgUrl = (proxyUrl.endsWith('/') ? proxyUrl : proxyUrl + '/') + targetUrl;
      } else if (proxyEncode === 'true') {
        tgUrl = proxyUrl + encodeURIComponent(targetUrl);
      } else {
        tgUrl = (proxyUrl.endsWith('/') ? proxyUrl : proxyUrl + '/') + targetUrl.replace('https://api.telegram.org/', '');
      }
    } else {
      tgUrl = targetUrl;
    }

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
    const msg = error instanceof Error ? error.message : 'Upload proxy error';
    return new Response(
      JSON.stringify({ ok: false, description: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}