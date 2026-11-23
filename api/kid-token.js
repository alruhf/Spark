// POST /api/kid-token {kid}  Authorization: Bearer <parent access token>   (acc2, Allen 11/15 + 11/21)
// The trusted issuer that migration 20261115100000 left for later: a SHORT-LIVED (2 min) token scoped to ONE kid so the KID can pick
// their own PIN with spark_kid_set_pin (set-once; the parent session itself can never set a PIN, only clear it).
// Checks: the parent token is valid (Supabase /auth/v1/user), the kid belongs to that parent (read with the PARENT's token, so RLS
// decides), and the kid has no PIN yet. Preview + Production (pt7, Allen 11/22): without the SB_* variables -> 404. Never returns or logs secrets.
const crypto = require('crypto');
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
function out(res, code, obj) { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(obj)); }
async function body(req) { if (req.body && typeof req.body === 'object') return req.body; let s = ''; for await (const c of req) { s += c; if (s.length > 2000) break; } try { return JSON.parse(s || '{}'); } catch (e) { return {}; } }
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return out(res, 405, { error: 'method' }); }
  const U = (process.env.SB_SUPABASE_URL || '').replace(/\/$/, ''), PK = process.env.SB_SUPABASE_PUBLISHABLE_KEY || '', JS = process.env.SB_SUPABASE_JWT_SECRET || '';
  if (!U || !PK || !JS) return out(res, 404, { error: 'off' });
  const auth = String(req.headers.authorization || ''); const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const kid = String((await body(req)).kid || '');
  if (!tok || !/^[0-9a-f-]{36}$/.test(kid)) return out(res, 400, { error: 'bad_request' });
  const h = { apikey: PK, authorization: 'Bearer ' + tok };
  try {
    const u = await fetch(U + '/auth/v1/user', { headers: h }); if (!u.ok) return out(res, 401, { error: 'not_signed_in' });
    const user = await u.json(); if (!user || !user.id) return out(res, 401, { error: 'not_signed_in' });
    const k = await fetch(U + '/rest/v1/kid_profiles?select=id,parent_id,pin_kind&id=eq.' + kid, { headers: h });
    const rows = k.ok ? await k.json() : []; const row = rows[0];
    if (!row || row.parent_id !== user.id) return out(res, 403, { error: 'not_your_kid' });
    if (row.pin_kind) return out(res, 409, { error: 'pin_already_set' });
    const now = Math.floor(Date.now() / 1000);
    const pl = { sub: user.id, role: 'authenticated', aud: 'authenticated', iss: U + '/auth/v1', iat: now, exp: now + 120, spark_session_kind: 'kid', spark_kid_id: kid };
    const m = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + b64(JSON.stringify(pl));
    const sig = b64(crypto.createHmac('sha256', JS).update(m).digest());
    return out(res, 200, { token: m + '.' + sig, exp: pl.exp });
  } catch (e) { return out(res, 502, { error: 'upstream' }); }
};
