// Shared helpers for the anonymous play-signal store (progression plan). Postgres via DATABASE_URL.
// No npm dependency: uses Neon's HTTPS SQL endpoint (Vercel Marketplace "Neon" Postgres). Nothing is stored about who the child is.
const TABLE_SQL = `CREATE TABLE IF NOT EXISTS spark_signals (
  id bigserial PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now(), at timestamptz NOT NULL,
  dev text NOT NULL, sid text, band smallint, ua text, type text NOT NULL, area text, act text, spot text,
  subject text, ok smallint, first smallint, hint smallint, stuck smallint, ms integer, kind text, msg text, src text, fps smallint);
CREATE INDEX IF NOT EXISTS spark_signals_at ON spark_signals (at);
CREATE INDEX IF NOT EXISTS spark_signals_type_at ON spark_signals (type, at);
ALTER TABLE spark_signals ADD COLUMN IF NOT EXISTS level smallint;
ALTER TABLE spark_signals ADD COLUMN IF NOT EXISTS step smallint;`;
// weekly summary view: favourites, stuck spots and possible bugs by area and spot (last 7 days)
const VIEW_SQL = `CREATE OR REPLACE VIEW spark_signals_weekly AS
SELECT area, coalesce(act, spot, '-') AS spot,
  count(*) FILTER (WHERE type='enter') AS enters,
  count(DISTINCT dev) FILTER (WHERE type='enter') AS players,
  count(*) FILTER (WHERE type='replay') AS replays,
  coalesce(sum(ms) FILTER (WHERE type='leave'),0) AS play_ms,
  count(*) FILTER (WHERE type='result' AND ok=1) AS right_n,
  count(*) FILTER (WHERE type='result' AND ok=0) AS wrong_n,
  count(*) FILTER (WHERE type='stuck') AS stuck,
  count(DISTINCT dev) FILTER (WHERE type='stuck') AS stuck_players,
  count(*) FILTER (WHERE type IN ('error','deadtap','lowfps')) AS broken,
  count(*) FILTER (WHERE type='error') AS errors,
  count(*) FILTER (WHERE type='deadtap') AS dead_taps,
  count(*) FILTER (WHERE type='lowfps') AS low_fps
FROM spark_signals WHERE at > now() - interval '7 days' GROUP BY 1, 2;`;
function endpoint(url) {
  const u = new URL(url.replace(/^postgres(ql)?:/, 'https:'));
  return `https://${u.hostname}/sql`;
}
const dbUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
// opts.timeoutMs (optional): abort the HTTPS call after that many ms (used by the Spark answer library so a slow DB never delays Spark).
async function sql(query, params, opts) {
  const url = dbUrl();
  const ms = opts && opts.timeoutMs, ctl = ms ? new AbortController() : null, timer = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try {
  const r = await fetch(endpoint(url), {
    method: 'POST', signal: ctl ? ctl.signal : undefined,
    headers: { 'content-type': 'application/json', 'Neon-Connection-String': url, 'Neon-Raw-Text-Output': 'false', 'Neon-Array-Mode': 'false' },
    body: JSON.stringify({ query, params: params || [] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('db ' + r.status + ' ' + String(j.message || '').slice(0, 160));
  return j.rows || [];
  } finally { if (timer) clearTimeout(timer); }
}
let ready = null;
function ensure() {
  if (!ready) ready = (async () => { for (const q of (TABLE_SQL + '\n' + VIEW_SQL).split(/;\s*\n/).map(s => s.trim()).filter(Boolean)) await sql(q); })().catch(e => { ready = null; throw e; });
  return ready;
}
module.exports = { sql, ensure, dbUrl };
