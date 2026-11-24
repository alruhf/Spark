// POST /api/signals: anonymous play signals from the game (progression plan). Batches of events, no names, no recordings.
// Without DATABASE_URL it accepts (204) and logs a count only. With it, events go to Postgres table spark_signals.
const { cors } = require('./_cors');
const { sql, ensure, dbUrl } = require('./_signals-db');
const MAX_BYTES = 64 * 1024, MAX_EVENTS = 200, WIN = 60000, PERMIN = 20, hits = new Map();
const TYPES = new Set(['enter', 'leave', 'replay', 'result', 'wrong', 'skip', 'stuck', 'error', 'deadtap', 'lowfps', 'ladder', 'snapshot']);
const str = (v, n) => (v == null ? null : String(v).replace(/[\u0000-\u001f]/g, ' ').slice(0, n));
const int = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : null; };
function limited(key) {
  const now = Date.now(), h = (hits.get(key) || []).filter(t => now - t < WIN);
  h.push(now); hits.set(key, h);
  if (hits.size > 5000) hits.clear();
  return h.length > PERMIN;
}
async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return JSON.stringify(req.body);
  if (typeof req.body === 'string') return req.body;
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > MAX_BYTES) throw Object.assign(new Error('too big'), { code: 413 }); chunks.push(c); }
  return Buffer.concat(chunks).toString('utf8');
}
function clean(body) {
  const dev = str(body && body.dev, 40);
  if (!dev || !/^[a-f0-9]{8,40}$/.test(dev) || !Array.isArray(body.events)) return null;
  const sid = str(body.sid, 24), band = int(body.age, 0, 3), ua = body.ua === 'phone' ? 'phone' : 'wide';
  const now = Date.now();
  const rows = body.events.slice(0, MAX_EVENTS).filter(e => e && TYPES.has(e.type)).map(e => {
    let t = int(e.t, 0, 9e15); if (!t || t > now + 300000 || t < now - 7 * 864e5) t = now;
    return { at: new Date(t).toISOString(), dev, sid, band, ua, type: e.type, area: str(e.area, 24), act: str(e.act, 40), spot: str(e.spot, 40),
      subject: ['reading', 'math', 'science'].includes(e.subject) ? e.subject : null, ok: int(e.ok, 0, 1), first: int(e.first, 0, 1), hint: int(e.hint, 0, 1),
      stuck: int(e.stuck, 0, 1), ms: int(e.ms, 0, 864e5), kind: str(e.kind, 40), msg: str(e.msg, 160), src: str(e.src, 60), fps: int(e.fps, 0, 240), level: int(e.level, 0, 9), step: int(e.step, 0, 9) };
  });
  return { dev, rows };
}
module.exports = async (req, res) => {
  if (cors(req, res, 'POST')) return;  // Pages migration: no-op unless SPARK_CORS_ORIGINS is set
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('allow', 'POST'); return res.end(); }
  const len = Number(req.headers['content-length'] || 0);
  if (len > MAX_BYTES) { res.statusCode = 413; return res.end(); }
  let body;
  try { body = JSON.parse(await readBody(req)); } catch (e) { res.statusCode = e.code === 413 ? 413 : 400; return res.end(); }
  const c = clean(body);
  if (!c) { res.statusCode = 400; return res.end(); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (limited(c.dev) || (ip && limited('ip:' + ip))) { res.statusCode = 429; return res.end(); }
  if (!c.rows.length) { res.statusCode = 204; return res.end(); }
  if (!dbUrl()) { console.log('signals: accepted ' + c.rows.length + ' events (no DATABASE_URL, not stored)'); res.statusCode = 204; return res.end(); }
  try {
    await ensure();
    await sql(`INSERT INTO spark_signals (at,dev,sid,band,ua,type,area,act,spot,subject,ok,first,hint,stuck,ms,kind,msg,src,fps,level,step)
      SELECT at,dev,sid,band,ua,type,area,act,spot,subject,ok,first,hint,stuck,ms,kind,msg,src,fps,level,step FROM jsonb_to_recordset($1::jsonb) AS x(
      at timestamptz, dev text, sid text, band smallint, ua text, type text, area text, act text, spot text, subject text,
      ok smallint, first smallint, hint smallint, stuck smallint, ms integer, kind text, msg text, src text, fps smallint, level smallint, step smallint)`, [JSON.stringify(c.rows)]);
    res.statusCode = 204; return res.end();
  } catch (e) {
    console.error('signals: store failed', String(e.message || e).slice(0, 200));
    res.statusCode = 204; return res.end(); // never break the game over analytics
  }
};
