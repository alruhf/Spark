// /api/spark-answers - admin API for Spark's saved answer library, kid ideas and build ideas (for Spark Insights). Never called by the game.
// spark11 auth: header x-signals-key must equal env SPARK_ANSWERS_KEY (timing-safe). No fallback to SIGNALS_READ_KEY.
// Fails closed: SPARK_ANSWERS_KEY unset/empty -> 503 {error:'not_configured'} for every request, before any DB call. Header only (no ?key=).
//   GET  ?status=pending|approved|rejected|all&source=&area=&q=&sort=default|used|asked|recent|unused&limit=1..500 -> {counts, rows, sort}
//   GET  ?view=insights  -> {top_answers, top_unanswered, never_used, never_used_total, by_area, totals}
//   GET  ?view=ideas[&test=1]  -> {rows, missing}  (kid ideas from spark_ideas, newest first, similar count, build_id)
//   GET  ?view=builds[&status=&area=]  -> {rows, counts, statuses}
//   POST {op:'seed'} -> {answers:{total,inserted,skipped}, builds:{...}}   (idempotent)
//   POST {op:'add'|'edit'|'approve'|'reject', ...}  answers;
//   POST {op:'auto-answer', id, answer, area?, variants?}  spark14: daily routine answers a PENDING kid/grok question -> approved, written_by 'auto'.
//        Runs the _auto-guard content rules on the question and the answer; 422 {error:'guard', reason} when either fails (row left for Allen).
//   POST {op:'auto-clip', id, h, mp3}  spark14: store the Ava clip (mp3 as base64) for an AUTO-written approved answer; h must equal sha256(stored answer text).
//        Never creates the table (tools/auto-role.sql does, on Allen's go): 503 {error:'clips_table_missing'} until then.
//   GET  ...&written_by=auto  -> only auto-written rows (Insights "Auto-written" filter)  {op:'build-add'|'build-edit'|'build-delete'|'build-from-idea', ...}  build ideas
// Answers: text only, max 160 chars, no links/emails/markup/emoji (cleaned by _spark-answers.cleanAnswer).
const crypto = require('crypto');
const L = require('./_spark-answers');
const BI = require('./_spark-builds');
const G = require('./_auto-guard');
const B = require('./_spark-brain');
const { dbUrl } = require('./_signals-db');
const sql = (q, p) => L.sql(q, p, { timeoutMs: 5000 });
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
const send = (res, code, o) => { res.statusCode = code; res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  if (o === undefined) return res.end(); res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let d = typeof req.body === 'string' ? req.body : '';
  if (!d) { let size = 0; for await (const c of req) { size += c.length; if (size > 450000) throw new Error('big'); d += c; } } // spark14: room for one base64 Ava clip
  return JSON.parse(d || '{}');
}
const COLS = 'id, question, norm_key, keywords, variants, answer, action, place, area, status, source, hits, served_count, last_served_at, env, created_at, updated_at, approved_at, last_hit_at, written_by';
const SORTS = { default: `(status = 'pending') DESC, hits DESC, updated_at DESC`, used: `served_count DESC, id ASC`, asked: `hits DESC, updated_at DESC`,
  recent: `id DESC`, unused: `served_count ASC, id ASC` };
function cleanVariants(v) {
  const arr = Array.isArray(v) ? v : String(v || '').split(/\n|\|/);
  return [...new Set(arr.map(x => L.redact(x).replace(/\|/g, ' ').trim()).filter(x => x.length >= 3))].slice(0, 12).join(' | ');
}
// validate the answer fields of add/edit; returns {err} or the clean values
function fields(b, needQuestion) {
  const out = {};
  if (b.question !== undefined || needQuestion) {
    const question = L.redact(b.question);
    if (question.length < 3 || !L.normKey(question)) return { err: 'question_required' };
    out.question = question; out.norm_key = L.normKey(question);
  }
  if (b.answer !== undefined && b.answer !== null && b.answer !== '') {
    if (String(b.answer).trim().length > L.MAX_ANSWER) return { err: 'answer_too_long' };
    const answer = L.cleanAnswer(b.answer);
    if (!answer) return { err: 'answer_empty_after_cleaning' };
    out.answer = answer;
  } else if (b.answer === '' || b.answer === null) out.answer = null;
  if (b.action !== undefined) { if (!L.ACTIONS.includes(b.action)) return { err: 'bad_action' }; out.action = b.action; }
  if (b.place !== undefined) { if (b.place && !B.PLACES[b.place]) return { err: 'bad_place' }; out.place = b.place || null; }
  if (b.area !== undefined) { if (b.area && !L.AREAS.includes(b.area)) return { err: 'bad_area' }; out.area = b.area || null; }
  if (b.variants !== undefined) out.variants = cleanVariants(b.variants);
  if (b.keywords !== undefined) out.keywords = L.cleanKeywords(b.keywords);
  else if (out.question) out.keywords = L.defaultKeywords(out.question);
  return out;
}
const idOf = v => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
async function insights() {
  const [top, unans, never, nevern, area, totals] = [
    await sql(`/*answers:ins-top*/ SELECT id, question, answer, area, hits, served_count, last_served_at FROM spark_answers WHERE status = 'approved' AND served_count > 0 ORDER BY served_count DESC, last_served_at DESC LIMIT 10`),
    await sql(`/*answers:ins-unanswered*/ SELECT id, question, area, hits, source, answer, last_hit_at, updated_at FROM spark_answers WHERE status = 'pending' AND source IN ('kid-unanswered','grok') ORDER BY hits DESC, updated_at DESC LIMIT 10`),
    await sql(`/*answers:ins-never*/ SELECT id, question, answer, area, source, hits, approved_at FROM spark_answers WHERE status = 'approved' AND served_count = 0 ORDER BY approved_at DESC NULLS LAST, id ASC LIMIT 20`),
    await sql(`/*answers:ins-nevern*/ SELECT count(*)::int AS n FROM spark_answers WHERE status = 'approved' AND served_count = 0`),
    await sql(`/*answers:ins-area*/ SELECT coalesce(area, 'none') AS area, count(*) FILTER (WHERE status = 'approved')::int AS approved, count(*) FILTER (WHERE status = 'pending')::int AS pending,
      count(*) FILTER (WHERE status = 'rejected')::int AS rejected, coalesce(sum(served_count),0)::int AS served, coalesce(sum(hits) FILTER (WHERE status = 'pending'),0)::int AS asked_unanswered
      FROM spark_answers GROUP BY 1 ORDER BY served DESC, approved DESC`),
    await sql(`/*answers:ins-totals*/ SELECT count(*)::int AS rows, count(*) FILTER (WHERE status = 'approved')::int AS approved, count(*) FILTER (WHERE status = 'pending')::int AS pending,
      coalesce(sum(served_count),0)::int AS served, count(*) FILTER (WHERE source = 'seed')::int AS seeds FROM spark_answers`)];
  return { generated: new Date().toISOString(), top_answers: top, top_unanswered: unans, never_used: never, never_used_total: (nevern[0] && +nevern[0].n) || 0, by_area: area, totals: totals[0] || {} };
}
module.exports = async (req, res) => {
  const want = process.env.SPARK_ANSWERS_KEY;
  if (!want) return send(res, 503, { error: 'not_configured' });
  const got = req.headers['x-signals-key'];
  if (!got || !same(got, want)) return send(res, 401, { error: 'unauthorized' });
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('allow', 'GET, POST'); return send(res, 405); }
  if (!dbUrl()) return send(res, 503, { error: 'no DATABASE_URL' });
  try {
    await L.ensure(5000);
    if (req.method === 'GET') {
      const u = new URL(req.url, 'http://x'), P = k => u.searchParams.get(k);
      const view = P('view');
      if (view === 'insights') return send(res, 200, await insights());
      if (view === 'ideas') { const r = await BI.kidIdeas(P('test') === '1', Number(P('limit')) || 200); return send(res, 200, { generated: new Date().toISOString(), rows: r.rows, missing: r.missing }); }
      if (view === 'builds') { const st = BI.STATUSES.includes(P('status')) ? P('status') : null, ar = L.AREAS.includes(P('area')) ? P('area') : null;
        return send(res, 200, { generated: new Date().toISOString(), ...(await BI.list(st, ar)) }); }
      const st = P('status') || 'pending', src = P('source'), ar = P('area'), wb = L.WRITTEN_BY.includes(P('written_by')) ? P('written_by') : null;
      const status = L.STATUSES.includes(st) ? st : null, source = L.SOURCES.includes(src) ? src : null, area = L.AREAS.includes(ar) ? ar : null;
      const q = String(P('q') || '').replace(/[%_\\]/g, ' ').trim().slice(0, 80), like = q ? '%' + q + '%' : null;
      const sort = Object.prototype.hasOwnProperty.call(SORTS, P('sort')) ? P('sort') : 'default';
      const limit = Math.max(1, Math.min(500, Number(P('limit')) || 200));
      const rows = await sql(`/*answers:list:${sort}*/ SELECT ${COLS} FROM spark_answers WHERE ($1::text IS NULL OR status = $1::text) AND ($2::text IS NULL OR source = $2::text)
        AND ($3::text IS NULL OR area = $3::text) AND ($4::text IS NULL OR question ILIKE $4::text OR answer ILIKE $4::text OR variants ILIKE $4::text)
        AND ($6::text IS NULL OR written_by = $6::text)
        ORDER BY ${SORTS[sort]} LIMIT $5::int`, [status, source, area, like, limit, wb]);
      const counts = await sql(`/*answers:counts*/ SELECT status, source, count(*)::int AS n, coalesce(sum(hits),0)::int AS hits, coalesce(sum(served_count),0)::int AS served FROM spark_answers GROUP BY 1, 2`);
      return send(res, 200, { generated: new Date().toISOString(), status: status || 'all', source, area, written_by: wb, q: q || null, sort, counts, rows });
    }
    let b; try { b = await readJson(req); } catch (e) { return send(res, 400, { error: 'bad_json' }); }
    const op = b && b.op;
    if (op === 'seed') { const answers = await L.seed(); const builds = await BI.seed(); return send(res, 200, { answers, builds }); }
    // ---- build ideas ----
    if (op === 'build-add') { const f = BI.fields(b, true, L.AREAS); if (f.err) return send(res, 400, { error: f.err }); return send(res, 200, { row: await BI.add(f) }); }
    if (op === 'build-edit') { const id = idOf(b.id); if (!id) return send(res, 400, { error: 'id_required' }); const f = BI.fields(b, false, L.AREAS); if (f.err) return send(res, 400, { error: f.err });
      const r = await BI.edit(id, f); return r ? send(res, 200, { row: r }) : send(res, 404, { error: 'not_found' }); }
    if (op === 'build-delete') { const id = idOf(b.id); if (!id) return send(res, 400, { error: 'id_required' }); const d = await BI.remove(id); return d ? send(res, 200, { deleted: d }) : send(res, 404, { error: 'not_found' }); }
    if (op === 'build-from-idea') { const iid = idOf(b.idea_id); if (!iid) return send(res, 400, { error: 'idea_id_required' }); const r = await BI.fromKidIdea(iid, L.AREAS);
      return r && r.row ? send(res, 200, r) : send(res, 404, { error: 'not_found' }); }
    // ---- answers ----
    if (op === 'add') {
      const f = fields(b, true); if (f.err) return send(res, 400, { error: f.err });
      if ((f.action === 'highlight' || f.action === 'open') && !f.place) return send(res, 400, { error: 'place_required' });
      const status = b.status === 'approved' ? 'approved' : 'pending';
      if (status === 'approved' && !f.answer) return send(res, 400, { error: 'answer_required_to_approve' });
      const ex = await sql(`/*answers:find*/ SELECT id, status FROM spark_answers WHERE norm_key = $1`, [f.norm_key]);
      if (ex.length) return send(res, 409, { error: 'exists', id: ex[0].id, status: ex[0].status });
      const r = await sql(`/*answers:add*/ INSERT INTO spark_answers (question, norm_key, keywords, answer, action, place, status, source, env, approved_at, area, variants)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', $8, CASE WHEN $7 = 'approved' THEN now() END, $9, $10) RETURNING ${COLS}`,
        [f.question, f.norm_key, f.keywords || '', f.answer || null, f.action || 'say', f.place || null, status, process.env.VERCEL_ENV || 'local', f.area || null, f.variants || '']);
      L.resetCache(); return send(res, 200, { row: r[0] });
    }
    if (op === 'auto-answer') {
      const aid = idOf(b.id); if (!aid) return send(res, 400, { error: 'id_required' });
      const cur = await sql(`/*answers:get*/ SELECT ${COLS} FROM spark_answers WHERE id = $1`, [aid]);
      if (!cur.length) return send(res, 404, { error: 'not_found' });
      const c = cur[0];
      // only questions still waiting (kid-unanswered / grok); never touches anything Allen approved, rejected or wrote
      if (c.status !== 'pending' || !['kid-unanswered', 'grok'].includes(c.source)) return send(res, 409, { error: 'not_pending', status: c.status, source: c.source });
      const g = G.check(c.question, b.answer); if (!g.ok) return send(res, 422, { error: 'guard', reason: g.reason });
      if (b.area !== undefined && b.area !== null && b.area !== '' && !L.AREAS.includes(b.area)) return send(res, 400, { error: 'bad_area' });
      const variants = b.variants !== undefined ? cleanVariants(b.variants) : (c.variants || '');
      const r = await sql(`/*answers:auto*/ UPDATE spark_answers SET answer = $2, action = 'say', place = NULL, area = coalesce($3, area), variants = $4,
          status = 'approved', approved_at = now(), updated_at = now(), written_by = 'auto'
        WHERE id = $1 AND status = 'pending' AND source IN ('kid-unanswered','grok') RETURNING ${COLS}`, [aid, g.answer, b.area || null, variants]);
      if (!r.length) return send(res, 409, { error: 'not_pending' });
      L.resetCache(); return send(res, 200, { row: r[0] });
    }
    if (op === 'auto-clip') {
      const cid = idOf(b.id); if (!cid) return send(res, 400, { error: 'id_required' });
      const h = String(b.h || '').toLowerCase(); if (!L.CLIP_RE.test(h)) return send(res, 400, { error: 'bad_h' });
      const mp3 = Buffer.from(String(b.mp3 || ''), 'base64'); if (!L.isMp3(mp3)) return send(res, 400, { error: 'bad_mp3' });
      const cur = await sql(`/*answers:get*/ SELECT ${COLS} FROM spark_answers WHERE id = $1`, [cid]);
      if (!cur.length) return send(res, 404, { error: 'not_found' });
      const c = cur[0];
      if (c.status !== 'approved' || c.written_by !== 'auto' || !c.answer) return send(res, 409, { error: 'not_auto_approved' });
      if (L.clipHash(c.answer) !== h) return send(res, 409, { error: 'text_changed' });
      try {
        const r = await sql(`/*answers:clip-put*/ INSERT INTO spark_answer_clips AS c (h, answer_id, mp3) VALUES ($1, $2, decode($3, 'base64'))
          ON CONFLICT (h) DO UPDATE SET mp3 = EXCLUDED.mp3, answer_id = EXCLUDED.answer_id, created_at = now() RETURNING c.h, c.answer_id, octet_length(c.mp3) AS bytes`, [h, cid, mp3.toString('base64')]);
        return send(res, 200, { clip: r[0] });
      } catch (e) { if (/does not exist/i.test(String(e.message))) return send(res, 503, { error: 'clips_table_missing' }); throw e; }
    }
    const id = idOf(b && b.id);
    if (op === 'edit' || op === 'approve' || op === 'reject') { if (!id) return send(res, 400, { error: 'id_required' }); } else return send(res, 400, { error: 'bad_op' });
    if (op === 'edit') {
      const f = fields(b, false); if (f.err) return send(res, 400, { error: f.err });
      const cur = await sql(`/*answers:get*/ SELECT ${COLS} FROM spark_answers WHERE id = $1`, [id]);
      if (!cur.length) return send(res, 404, { error: 'not_found' });
      const n = { ...cur[0], ...f };
      if ((n.action === 'highlight' || n.action === 'open') && !B.PLACES[n.place]) return send(res, 400, { error: 'place_required' });
      if (n.status === 'approved' && !n.answer) return send(res, 400, { error: 'approved_needs_answer' });
      if (f.norm_key && f.norm_key !== cur[0].norm_key) {
        const ex = await sql(`/*answers:find*/ SELECT id, status FROM spark_answers WHERE norm_key = $1`, [f.norm_key]);
        if (ex.length) return send(res, 409, { error: 'exists', id: ex[0].id, status: ex[0].status });
      }
      // spark14: when Allen changes the text of an auto-written answer it becomes his (badge goes away)
      const wb = cur[0].written_by === 'auto' && (n.answer || null) !== (cur[0].answer || null) ? 'allen' : (cur[0].written_by || null);
      const r = await sql(`/*answers:edit*/ UPDATE spark_answers SET question = $2, norm_key = $3, keywords = $4, answer = $5, action = $6, place = $7, area = $8, variants = $9, written_by = $10, updated_at = now()
        WHERE id = $1 RETURNING ${COLS}`, [id, n.question, n.norm_key, n.keywords || '', n.answer || null, n.action || 'say', n.place || null, n.area || null, n.variants || '', wb]);
      L.resetCache(); return send(res, 200, { row: r[0] });
    }
    const r = op === 'approve'
      ? await sql(`/*answers:approve*/ UPDATE spark_answers SET status = 'approved', approved_at = now(), updated_at = now()
          WHERE id = $1 AND answer IS NOT NULL AND length(answer) BETWEEN 1 AND 160 RETURNING ${COLS}`, [id])
      : await sql(`/*answers:reject*/ UPDATE spark_answers SET status = 'rejected', updated_at = now() WHERE id = $1 RETURNING ${COLS}`, [id]);
    if (!r.length) {
      const cur = await sql(`/*answers:get*/ SELECT id FROM spark_answers WHERE id = $1`, [id]);
      return send(res, cur.length ? 400 : 404, { error: cur.length ? 'answer_required_to_approve' : 'not_found' });
    }
    L.resetCache(); return send(res, 200, { row: r[0] });
  } catch (e) {
    console.error('spark-answers admin failed');
    return send(res, 500, { error: 'db_failed' });
  }
};
