// TeleDrive — Telegram File Upload Proxy (Vercel Edge Function)
// Menerima multipart dari browser, meneruskan mentah ke Telegram Bot API
// Edge Runtime = body tidak di-parse, kita forward langsung

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
    const contentType = req.headers.get('content-type') || '';
    const body = await req.arrayBuffer();
    const bodyBytes = new Uint8Array(body);

    // Parse multipart untuk ambil bot_token, chat_id, proxy_url
    // Lalu forward body mentah ke Telegram (sudah dalam format multipart yang benar)
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
    if (!boundaryMatch) {
      return new Response(
        JSON.stringify({ ok: false, description: 'Content-Type tidak valid' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const fields = parseMultipartFields(bodyBytes, boundary);

    const botToken = fields.get('bot_token');
    const chatId = fields.get('chat_id');
    const proxyUrl = (fields.get('proxy_url') || '').trim();

    if (!botToken || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, description: 'bot_token dan chat_id diperlukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Bangun URL target
    let tgUrl;
    if (proxyUrl) {
      const base = proxyUrl.endsWith('/') ? proxyUrl : proxyUrl + '/';
      tgUrl = base + 'bot' + botToken + '/sendDocument';
    } else {
      tgUrl = 'https://api.telegram.org/bot' + botToken + '/sendDocument';
    }

    // Forward body mentah ke Telegram (sudah format multipart yang benar dari browser)
    const tgResp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: body,
      // @ts-ignore — duplex untuk streaming body
      duplex: 'half-duplex',
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
    const msg = error instanceof Error ? error.message : 'Upload proxy error';
    return new Response(
      JSON.stringify({ ok: false, description: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

// ========== HELPER: Parse multipart hanya untuk text fields ==========
// Kita tidak perlu parse file — cukup baca field bot_token, chat_id, proxy_url
function parseMultipartFields(body, boundary) {
  const fields = new Map();
  const boundaryBytes = new TextEncoder().encode('--' + boundary);
  const decoder = new TextDecoder('utf-8', { fatal: false });

  let pos = 0;
  while (pos < body.length) {
    // Cari boundary
    const idx = findBytes(body, boundaryBytes, pos);
    if (idx === -1) break;

    // Cari end of headers (double CRLF)
    const headerEnd = findDoubleCRLF(body, idx + boundaryBytes.length);
    if (headerEnd === -1) break;

    // Parse Content-Disposition header
    const headerStr = decoder.decode(body.slice(idx + boundaryBytes.length, headerEnd));
    const nameMatch = headerStr.match(/name="([^"]+)"/);

    if (!nameMatch) {
      pos = headerEnd + 4;
      continue;
    }

    const fieldName = nameMatch[1];

    // Cari end part (next boundary)
    const nextBoundary = findBytes(body, boundaryBytes, headerEnd + 4);
    if (nextBoundary === -1) break;

    // Data part adalah antara headerEnd+4 dan nextBoundary-2 (CR LF sebelum boundary)
    const partData = body.slice(headerEnd + 4, nextBoundary - 2);

    // Hanya simpan text fields yang kita butuhkan
    if (['bot_token', 'chat_id', 'proxy_url'].includes(fieldName)) {
      fields.set(fieldName, decoder.decode(partData));
    }

    pos = nextBoundary;
  }

  return fields;
}

function findBytes(haystack, needle, start) {
  for (let i = start; i <= haystack.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function findDoubleCRLF(data, start) {
  for (let i = start; i < data.length - 3; i++) {
    if (data[i] === 13 && data[i + 1] === 10 && data[i + 2] === 13 && data[i + 3] === 10) {
      return i;
    }
  }
  return -1;
}