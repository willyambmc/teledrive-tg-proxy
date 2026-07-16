// TeleDrive — Health Check (Vercel Edge Function)
// Endpoint diagnostic untuk cek apakah functions berjalan

export const config = {
  runtime: 'edge',
};

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

  return new Response(JSON.stringify({
    status: 'ok',
    service: 'teledrive-vercel',
    timestamp: new Date().toISOString(),
    message: 'Functions aktif! TeleDrive API siap.'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}