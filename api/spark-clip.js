// GET|HEAD /api/spark-clip?h=<sha256 hex of the answer text>  -> audio/mpeg (spark14, Allen 11/14: auto-written answers spoken in Ava on every device)
// Public and read-only (the game calls it; no key): serves the Ava mp3 stored in spark_answer_clips when SOME answer that is APPROVED right now
// has text that hashes to h (content-addressed: two answers with the same words share one clip) (an edited/rejected answer never plays an old clip). Never writes, never runs DDL (the clips table is created only by
// tools/auto-role.sql on Allen's go; until then every request is a clean 404 and the client falls back to the baked clip, then the caption).
// Content-addressed -> long immutable cache on hits; misses are cached only briefly so a newly stored clip shows up within a minute. Supports Range (Safari).
const L = require('./_spark-answers');
const { dbUrl } = require('./_signals-db');
const DB_MS = 2500;
function fail(res, code, err, cache) { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('x-robots-tag', 'noindex');
  res.setHeader('cache-control', cache || 'no-store'); res.end(JSON.stringify({ error: err })); }
module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); return fail(res, 405, 'method'); }
  const h = String(new URL(req.url, 'http://x').searchParams.get('h') || '').toLowerCase();
  if (!L.CLIP_RE.test(h)) return fail(res, 400, 'bad_h', 'public, max-age=3600');
  if (!dbUrl() || process.env.SPARK_ANSWERS_OFF === '1') return fail(res, 404, 'no_clip', 'public, max-age=60');
  let rows;
  try {
    rows = await L.sql(`/*answers:clip-get*/ SELECT encode(c.mp3, 'base64') AS b64 FROM spark_answer_clips c
      WHERE c.h = $1 AND EXISTS (SELECT 1 FROM spark_answers a WHERE a.status = 'approved' AND a.answer IS NOT NULL AND encode(sha256(convert_to(a.answer, 'UTF8')), 'hex') = $1) LIMIT 1`, [h], { timeoutMs: DB_MS });
  } catch (e) {
    // clips table not created yet (before Allen's go) -> a normal miss; anything else -> temporary failure, not cached
    if (/does not exist/i.test(String(e.message))) return fail(res, 404, 'no_clip', 'public, max-age=60');
    console.error('spark-clip: db failed'); return fail(res, 503, 'db_failed');
  }
  const buf = rows && rows[0] && rows[0].b64 ? Buffer.from(String(rows[0].b64).replace(/\s+/g, ''), 'base64') : null;
  if (!buf) return fail(res, 404, 'no_clip', 'public, max-age=60');
  if (!L.isMp3(buf)) { console.error('spark-clip: stored clip is not mp3'); return fail(res, 404, 'no_clip', 'public, max-age=60'); }
  const etag = '"' + h.slice(0, 32) + '"';
  res.setHeader('content-type', 'audio/mpeg'); res.setHeader('cache-control', 'public, max-age=31536000, immutable');
  res.setHeader('etag', etag); res.setHeader('accept-ranges', 'bytes'); res.setHeader('x-robots-tag', 'noindex'); res.setHeader('x-content-type-options', 'nosniff');
  if (req.headers['if-none-match'] === etag) { res.statusCode = 304; return res.end(); }
  let body = buf; res.statusCode = 200;
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || '').trim());
  if (m && (m[1] || m[2])) {
    let a = m[1] ? +m[1] : buf.length - +m[2], b = m[1] && m[2] ? Math.min(+m[2], buf.length - 1) : buf.length - 1; if (a < 0) a = 0;
    if (a > b || a >= buf.length) { res.statusCode = 416; res.setHeader('content-range', 'bytes */' + buf.length); return res.end(); }
    body = buf.slice(a, b + 1); res.statusCode = 206; res.setHeader('content-range', `bytes ${a}-${b}/${buf.length}`);
  }
  res.setHeader('content-length', String(body.length));
  res.end(req.method === 'HEAD' ? undefined : body);
};
