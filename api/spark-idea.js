// POST /api/spark-idea  {idea, area, tag}  -> 204.  Kids' "please make/change..." ideas, saved as TEXT ONLY (Allen 11/12).
// Stored: idea text (max 200 chars, lightly redacted), area, time, tag ('test'|'live'), deployment env. No audio, no name, no child or device id.
// Same Postgres as /api/signals (DATABASE_URL, Neon HTTPS). Table spark_ideas - read it from spark-insights later (see NOTES.md).
// Non-production only: GET/DELETE ?tag=test lists / removes test rows, so automated checks can read back and clean up.
const { sql, dbUrl } = require('./_signals-db');
const MIN = 60000, DAY = 864e5, hits = new Map();
const TABLE = `CREATE TABLE IF NOT EXISTS spark_ideas (
  id bigserial PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now(), at timestamptz NOT NULL DEFAULT now(),
  idea text NOT NULL, area text, tag text NOT NULL DEFAULT 'live', env text);
CREATE INDEX IF NOT EXISTS spark_ideas_at ON spark_ideas (at)`;
let ready = null;
const ensure = () => (ready = ready || (async () => { for (const q of TABLE.split(/;\s*\n/)) await sql(q.trim()); })().catch(e => { ready = null; throw e; }));
function count(key, win) { const now = Date.now(), h = (hits.get(key) || []).filter(t => now - t < win); h.push(now); hits.set(key, h); if (hits.size > 20000) hits.clear(); return h.length; }
// light redaction: no emails, links, phone-like numbers or "my name is X"
function redact(s) {
  return String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/https?:\/\/\S+|www\.\S+/gi, '[link]').replace(/\S+@\S+\.\S+/g, '[email]')
    .replace(/\d[\d\s-]{4,}\d/g, '[number]').replace(/\b(my name is|i am called|i'm called|call me)\s+[A-Za-z]+/gi, '$1 [name]').replace(/\s+/g, ' ').trim().slice(0, 200);
}
const AREAS = new Set(['home', 'earth', 'egypt', 'savannah', 'reef', 'arctic', 'continent', 'planet']);
async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let d = typeof req.body === 'string' ? req.body : '';
  if (!d) { let size = 0; for await (const c of req) { size += c.length; if (size > 4096) throw new Error('big'); d += c; } }
  return JSON.parse(d || '{}');
}
const json = (res, code, o) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(o)); };
module.exports = async (req, res) => {
  const env = process.env.VERCEL_ENV || 'local';
  const tagParam = new URL(req.url, 'http://x').searchParams.get('tag');
  if ((req.method === 'GET' || req.method === 'DELETE') && tagParam === 'test' && env !== 'production') {
    if (!dbUrl()) return json(res, 503, { error: 'no DATABASE_URL' });
    try { await ensure();
      if (req.method === 'GET') return json(res, 200, { rows: await sql(`SELECT id, at, idea, area, tag, env FROM spark_ideas WHERE tag='test' ORDER BY id DESC LIMIT 20`) });
      const del = await sql(`DELETE FROM spark_ideas WHERE tag='test' AND at > now() - interval '2 days' RETURNING id`); return json(res, 200, { deleted: del.length });
    } catch (e) { return json(res, 500, { error: 'db' }); }
  }
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('allow', 'POST'); return res.end(); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  if (count('m:' + ip, MIN) > 6 || count('d:' + ip, DAY) > 60) { res.statusCode = 429; return res.end(); }
  let b; try { b = await readJson(req); } catch (e) { res.statusCode = 400; return res.end(); }
  const idea = redact(b.idea); if (idea.length < 2) { res.statusCode = 400; return res.end(); }
  const area = AREAS.has(b.area) ? b.area : null, tag = b.tag === 'test' ? 'test' : 'live';
  if (!dbUrl()) { console.log('spark-idea: accepted (no DATABASE_URL, not stored)'); res.statusCode = 204; return res.end(); }
  try { await ensure(); await sql('INSERT INTO spark_ideas (idea, area, tag, env) VALUES ($1, $2, $3, $4)', [idea, area, tag, env]); res.statusCode = 204; return res.end(); }
  catch (e) { console.error('spark-idea: store failed', String(e.message || e).slice(0, 120)); res.statusCode = 204; return res.end(); }
};
