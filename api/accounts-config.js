// GET /api/accounts-config (acc2, Allen 11/21: family accounts on PREVIEW; Allen 11/22 10:27 PM ET: also on LIVE/production).
// Returns the Supabase project URL + PUBLISHABLE key (both are public by design; RLS protects every row) only when this
// SB_* variables exist (Preview + Production since pt7). Without them -> {on:false} and the game stays guest play. Never returns any secret.
module.exports = (req, res) => {
  res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const url = process.env.SB_SUPABASE_URL || '', key = process.env.SB_SUPABASE_PUBLISHABLE_KEY || '';
  const on = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) && /^sb_publishable_/.test(key);
  res.end(JSON.stringify(on ? { on: true, url: url.replace(/\/$/, ''), key } : { on: false }));
};
