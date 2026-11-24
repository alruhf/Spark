// Cross-origin support for the public game endpoints (Pages migration step 1, Allen 11/22 11:41 PM ET).
// Allowed origins come ONLY from env SPARK_CORS_ORIGINS (comma list of exact origins, e.g. "https://play.example.com").
// Unset/empty -> this helper does nothing at all (no headers, OPTIONS falls through to the endpoint's own 405), i.e. exactly today's behaviour.
// No credentials/cookies are ever allowed; only the exact listed origins are echoed back (never "*").
function allowed() {
  return String(process.env.SPARK_CORS_ORIGINS || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(s => /^https?:\/\/[^/\s]+$/i.test(s));
}
// Returns true when the request was a preflight that has been answered (caller must return).
function cors(req, res, methods) {
  const list = allowed();
  if (!list.length) return false;                       // off: unchanged behaviour
  res.setHeader('vary', 'Origin');
  const origin = String(req.headers.origin || '');
  const ok = !!origin && list.includes(origin);
  if (ok) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('access-control-allow-methods', methods + ', OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type');
    res.setHeader('access-control-max-age', '86400');
  }
  if (req.method === 'OPTIONS') { res.statusCode = ok ? 204 : 403; res.end(); return true; }
  return false;
}
module.exports = { cors, allowed };
