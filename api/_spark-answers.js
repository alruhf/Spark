// Spark's saved answer library (Allen 11/13 8:01 PM; spark11: seeds, phrasing variants, usage counts, idempotent migrations): answers Allen writes or approves, reused for free before any AI call.
// Table spark_answers in the same Neon Postgres as spark_signals / spark_ideas (DATABASE_URL). Text only:
// no kid names, no child or device ids, no audio. Only rows with status 'approved' are ever shown to a child.
// Every DB call here has a short timeout and every caller wraps it in try/catch, so a slow or broken DB never stops Spark answering.
const { sql, dbUrl } = require('./_signals-db');
const B = require('./_spark-brain');

const MAX_Q = 200, MAX_ANSWER = 160, DB_MS = 800, CACHE_MS = 60000, DOWN_MS = 30000;
const STATUSES = ['pending', 'approved', 'rejected'];
const SOURCES = ['manual', 'kid-unanswered', 'grok', 'seed'];
// areas Allen files answers under (seeds use the same list; 'general' = not tied to one place)
const AREAS = ['earth', 'africa', 'savannah', 'egypt', 'arctic', 'reef', 'north-america', 'australia', 'continents', 'general'];
// what a library answer may make Spark do (subset of B.TYPES; never start/idea/back)
const ACTIONS = ['say', 'hint', 'cheer', 'highlight', 'open', 'point'];
const MATCH_MIN = 0.75; // conservative: most of the words must be the same as a saved question

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS spark_answers (
  id bigserial PRIMARY KEY,
  question text NOT NULL,
  norm_key text NOT NULL,
  keywords text NOT NULL DEFAULT '',
  answer text,
  action text NOT NULL DEFAULT 'say',
  place text,
  area text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','kid-unanswered','grok','seed')),
  hits integer NOT NULL DEFAULT 0,
  served_count integer NOT NULL DEFAULT 0,
  last_served_at timestamptz,
  variants text NOT NULL DEFAULT '',
  env text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  last_hit_at timestamptz,
  CONSTRAINT spark_answers_approved_has_answer CHECK (status <> 'approved' OR (answer IS NOT NULL AND length(answer) BETWEEN 1 AND 160)));
CREATE UNIQUE INDEX IF NOT EXISTS spark_answers_key ON spark_answers (norm_key);
CREATE INDEX IF NOT EXISTS spark_answers_status ON spark_answers (status, hits DESC)`;
// spark11: idempotent upgrade of a spark10 table (safe to run on every cold start; each statement is a no-op the second time)
const MIGRATE_BASE = `ALTER TABLE spark_answers ADD COLUMN IF NOT EXISTS served_count integer NOT NULL DEFAULT 0;
ALTER TABLE spark_answers ADD COLUMN IF NOT EXISTS last_served_at timestamptz;
ALTER TABLE spark_answers ADD COLUMN IF NOT EXISTS variants text NOT NULL DEFAULT '';
DO $$ BEGIN
  ALTER TABLE spark_answers DROP CONSTRAINT IF EXISTS spark_answers_source_check;
  ALTER TABLE spark_answers ADD CONSTRAINT spark_answers_source_v2 CHECK (source IN ('manual','kid-unanswered','grok','seed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS spark_answers_served ON spark_answers (status, served_count DESC)`;
// spark14: the written_by column. Part of MIGRATE_SQL (production cold start + tests), but NEVER run from a Preview deployment:
// Preview and Production share one Neon DB, so a preview must not change its schema (tools/auto-role.sql adds the same column on Allen's go).
const MIGRATE_V14 = `ALTER TABLE spark_answers ADD COLUMN IF NOT EXISTS written_by text`;
const MIGRATE_SQL = MIGRATE_BASE + ';\n' + MIGRATE_V14;
const schemaSql = () => TABLE_SQL + ';\n' + (process.env.VERCEL_ENV === 'preview' ? MIGRATE_BASE : MIGRATE_SQL);
// spark14 (Allen 11/14 7:52 PM ET): who wrote the ANSWER text. NULL = Allen / seed / Grok (as before); 'auto' = the daily auto-answer routine
// (shown as "Auto-written" in Insights); 'allen' = an auto answer Allen later edited (badge goes away). 'source' still says where the QUESTION came from.
const WRITTEN_BY = ['auto', 'allen'];
// spark14 clips (Allen 11/14 11:2x PM ET: auto answers spoken in Ava on every device). An Ava mp3 per auto-written answer lives in
// spark_answer_clips (tools/auto-role.sql; created on Allen's go, never by this runtime). Key h = sha256 hex of the EXACT stored answer text,
// so an edited answer never plays an old clip. /api/spark-clip?h=<h> serves it; spark-ask returns the URL only for written_by 'auto' rows.
const crypto = require('crypto');
const clipHash = text => crypto.createHash('sha256').update(String(text == null ? '' : text), 'utf8').digest('hex');
const CLIP_RE = /^[0-9a-f]{64}$/;
const CLIP_MIN = 1000, CLIP_MAX = 300000;
// an mp3 starts with an ID3 tag or an MPEG audio frame sync (0xFFE/0xFFF)
const isMp3 = b => Buffer.isBuffer(b) && b.length >= CLIP_MIN && b.length <= CLIP_MAX && (b.slice(0, 3).toString('latin1') === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));
// split a SQL script into statements, keeping $$ ... $$ blocks whole
function statements(script) {
  const out = []; let cur = '', dollar = false;
  for (const line of script.split('\n')) {
    if ((line.match(/\$\$/g) || []).length % 2) dollar = !dollar;
    cur += (cur ? '\n' : '') + line;
    if (!dollar && /;\s*$/.test(line)) { out.push(cur.trim().replace(/;\s*$/, '')); cur = ''; }
  }
  if (cur.trim()) out.push(cur.trim().replace(/;\s*$/, ''));
  return out.filter(Boolean);
}

// ---------- text helpers ----------
// filler words a child (or speech-to-text) adds that don't change the question. Question words (why/what/where/how/who/when) are KEPT.
const STOP = new Set(('a an the is are am was were be do does did to of in on at for and or but so it its this that there these those ' +
  'please spark hey hi hello um uh umm er like just really very can could would will you your me i we us my tell know about ' +
  'okay ok oh yeah well hmm').split(' '));
const stem = w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') ? w.slice(0, -1) : w);
function tokens(q) {
  const t = B.norm(q).replace(/n't\b/g, ' not').replace(/'s\b/g, '').replace(/'/g, '');
  return [...new Set(t.split(' ').filter(w => w && !STOP.has(w)).map(stem))];
}
// normalized key: the meaningful words, de-duplicated and sorted, so "why is it cold in the arctic" == "why is the arctic cold"
const normKey = q => tokens(q).sort().join(' ').slice(0, 200);
const WH = new Set(['why', 'what', 'where', 'how', 'who', 'when', 'which']);
const defaultKeywords = q => tokens(q).filter(w => !WH.has(w)).join(' ');
function cleanKeywords(s) { return [...new Set(B.norm(s).split(' ').filter(Boolean).map(stem))].slice(0, 12).join(' '); }
// question text as stored: control chars out, no links/emails/phone-like numbers/"my name is X" (same rules as spark-idea)
function redact(s) {
  return String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/https?:\/\/\S+|www\.\S+/gi, '[link]').replace(/\S+@\S+\.\S+/g, '[email]')
    .replace(/\d[\d\s-]{4,}\d/g, '[number]').replace(/\b(my name is|i am called|i'm called|call me)\s+[A-Za-z]+/gi, '$1 [name]').replace(/\s+/g, ' ').trim().slice(0, MAX_Q);
}
// kid-safe answer line: text only (letters, numbers, simple punctuation), no links/emails/markup/emoji, max 160 chars
function cleanAnswer(s) {
  return B.cleanLine(String(s || '')).replace(/[^\p{L}\p{N} .,!?'’"\-:;()]/gu, '').replace(/\s+/g, ' ').trim().slice(0, MAX_ANSWER);
}

// ---------- matching (pure, no DB) ----------
// light filler only (keeps every real word) - used for the exact-phrase rule on one-word keys
const FILLER = new Set('please spark hey hi hello um uh umm er okay ok oh yeah well hmm so just really like'.split(' '));
const phrase = q => B.norm(q).split(' ').filter(w => w && !FILLER.has(w)).join(' ');
const variantsOf = r => String((r && r.variants) || '').split('|').map(v => v.trim()).filter(Boolean);
const vCache = new Map();
function keysOf(row) { // [norm_key, phrase] for the question and every phrasing variant
  const ck = row.id + '|' + row.norm_key + '|' + (row.variants || '') + '|' + (row.question || ''); let v = vCache.get(ck);
  if (!v) { v = [{ key: row.norm_key, phrase: row.question ? phrase(row.question) : null }].concat(variantsOf(row).map(x => ({ key: normKey(x), phrase: phrase(x) })));
    if (vCache.size > 5000) vCache.clear(); vCache.set(ck, v); }
  return v;
}
function score(qToks, qKey, row, qPhrase) {
  if (!row || !row.norm_key) return 0;
  let best = 0;
  for (const k of keysOf(row)) { const s = score1(qToks, qKey, k, row, qPhrase); if (s > best) best = s; if (best === 1) break; }
  return best;
}
function score1(qToks, qKey, kk, row, qPhrase) {
  if (!kk.key) return 0;
  const k = kk.key.split(' ').filter(Boolean);
  // one meaningful word ("who are you" -> "who"): only the same phrase counts, so "who is that" / "what is it" never match
  if (k.length < 2) return kk.phrase && qPhrase === kk.phrase ? 1 : 0;
  if (kk.key === qKey) return 1;
  const qs = new Set(qToks);
  const req = String(row.keywords || '').split(' ').filter(Boolean);
  if (req.length && !req.every(w => qs.has(w))) return 0; // every must-have word has to be in the child's question
  if (['not', 'never', 'no'].some(w => qs.has(w) !== k.includes(w))) return 0;
  if ([...WH].some(w => qs.has(w) !== k.includes(w))) return 0;
  const inter = k.filter(w => qs.has(w)).length;
  if (inter < 2) return 0;
  return (2 * inter) / (k.length + qs.size); // Dice similarity
}
function bestMatch(q, rows) {
  const qToks = tokens(q), qKey = qToks.slice().sort().join(' '), qPhrase = phrase(q);
  if (!qToks.length) return null;
  let best = null, bs = 0;
  for (const r of rows || []) {
    if (r.status !== 'approved' || !r.answer) continue; // approval gate (the SQL also filters; this is the second lock)
    const s = score(qToks, qKey, r, qPhrase);
    if (s > bs || (s === bs && best && (+r.served_count || 0) > (+best.served_count || 0))) { bs = s; best = r; }
  }
  return best && bs >= MATCH_MIN ? { row: best, score: bs } : null;
}
// library row -> Spark action (validated again by B.validate in spark-ask)
function toAction(row) {
  const line = cleanAnswer(row.answer);
  if (!line) return null;
  const type = ACTIONS.includes(row.action) ? row.action : 'say';
  const a = { type, line };
  if (type === 'highlight' || type === 'open') { if (!B.PLACES[row.place]) return { type: 'say', line }; a.place = row.place; }
  return a;
}

// ---------- DB ----------
let ready = null;
function ensure(ms) {
  if (!ready) ready = (async () => { for (const q of statements(schemaSql())) await sql(q, [], { timeoutMs: ms || 3000 }); })()
    .catch(e => { ready = null; throw e; });
  return ready;
}
let cache = { at: 0, rows: [] }, downUntil = 0;
const enabled = () => !!dbUrl() && process.env.SPARK_ANSWERS_OFF !== '1';
const up = () => Date.now() >= downUntil; // after a failed lookup, skip the DB for 30 s so a down DB costs one timeout, not one per request
async function approved() {
  const now = Date.now();
  if (now < downUntil) return [];
  // Always recheck approval in the DB (no stale approved answer after rejection in another server instance).
  try {
    await ensure(DB_MS);
    // written_by via to_jsonb so this works before AND after the written_by column exists (shared DB; preview never adds it)
    const rows = await sql(`/*answers:approved*/ SELECT id, question, norm_key, keywords, variants, answer, action, place, status, hits, served_count, to_jsonb(s)->>'written_by' AS written_by
      FROM spark_answers s WHERE status = 'approved' AND answer IS NOT NULL ORDER BY served_count DESC LIMIT 3000`, [], { timeoutMs: DB_MS });
    cache = { at: now, rows };
    return rows;
  } catch (e) { downUntil = now + DOWN_MS; console.error('spark-answers: lookup failed'); return []; }
}
// find an approved answer for the child's question (null when none, DB off or DB down)
async function lookup(q) {
  if (!enabled() || !tokens(q).length) return null;
  const m = bestMatch(q, await approved());
  if (!m) return null;
  const action = toAction(m.row);
  if (!action) return null;
  // usage: served_count = how often an approved answer was SAID. spark15 (Allen 11/15): hits = how often kids ASKED this question, counted on EVERY ask -
  // answered (here) and unanswered (logUnanswered) - so Insights can show one ask count next to every question. No schema change (existing columns).
  await sql(`/*answers:served*/ UPDATE spark_answers SET served_count = served_count + 1, last_served_at = now(), hits = hits + 1, last_hit_at = now() WHERE id = $1`, [m.row.id], { timeoutMs: DB_MS }).catch(() => {});
  // spark14: auto-written answers carry their Ava clip key (the clip itself may not exist yet; the client falls back to a baked clip, then caption)
  const clip = m.row.written_by === 'auto' && m.row.answer ? clipHash(m.row.answer) : null;
  return { id: m.row.id, score: m.score, action, clip };
}
// a question nothing could answer -> pending row for Allen (dedupe by norm_key, bump hits). Never throws.
async function logUnanswered(q, area) {
  try {
    if (!enabled() || !up()) return false;
    const question = redact(q), key = normKey(question);
    if (!key || question.length < 3) return false;
    await ensure(DB_MS);
    await sql(`/*answers:unanswered*/ INSERT INTO spark_answers (question, norm_key, keywords, status, source, area, hits, env, last_hit_at)
      VALUES ($1, $2, $3, 'pending', 'kid-unanswered', $4, 1, $5, now())
      ON CONFLICT (norm_key) DO UPDATE SET hits = spark_answers.hits + 1, updated_at = now(), last_hit_at = now()`,
      [question, key, defaultKeywords(question), area || null, process.env.VERCEL_ENV || 'local'], { timeoutMs: DB_MS });
    return true;
  } catch (e) { downUntil = Date.now() + DOWN_MS; console.error('spark-answers: log failed'); return false; }
}
// a Grok answer -> pending row (source 'grok') for Allen to approve. Only reached when Grok is switched on. Never throws.
async function saveGrok(q, action, area) {
  try {
    if (!enabled() || !up() || !action || !ACTIONS.includes(action.type)) return false;
    const question = redact(q), key = normKey(question), answer = cleanAnswer(action.line);
    if (!key || !answer) return false;
    await ensure(DB_MS);
    await sql(`/*answers:grok*/ INSERT INTO spark_answers (question, norm_key, keywords, answer, action, place, status, source, area, hits, env)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'grok', $7, 1, $8)
      ON CONFLICT (norm_key) DO UPDATE SET hits = spark_answers.hits + 1, updated_at = now(),
        answer = CASE WHEN spark_answers.answer IS NULL AND spark_answers.status = 'pending' THEN EXCLUDED.answer ELSE spark_answers.answer END,
        action = CASE WHEN spark_answers.answer IS NULL AND spark_answers.status = 'pending' THEN EXCLUDED.action ELSE spark_answers.action END,
        place = CASE WHEN spark_answers.answer IS NULL AND spark_answers.status = 'pending' THEN EXCLUDED.place ELSE spark_answers.place END`,
      [question, key, defaultKeywords(question), answer, action.type, action.place || null, area || null, process.env.VERCEL_ENV || 'local'], { timeoutMs: DB_MS });
    return true;
  } catch (e) { downUntil = Date.now() + DOWN_MS; console.error('spark-answers: grok save failed'); return false; }
}
const resetCache = () => { cache = { at: 0, rows: [] }; downUntil = 0; };
// ---------- seeds (api/_seeds/answers.json, same file as spark11/seeds/answers.json) ----------
let seedCache = null;
function seedRows() {
  if (seedCache) return seedCache;
  const S = require('./_seeds/answers.json').answers || [], seen = new Set(), out = [];
  for (const s of S) {
    const question = redact(s.question), key = normKey(question), answer = cleanAnswer(s.answer);
    if (!key || !answer || seen.has(key) || !AREAS.includes(s.area)) continue; seen.add(key);
    const variants = (s.variants || []).map(v => redact(v).replace(/\|/g, ' ')).filter(Boolean).join(' | ');
    out.push({ question, norm_key: key, variants, keywords: '', answer, action: 'say', area: s.area });
  }
  return (seedCache = out);
}
// idempotent: ON CONFLICT (norm_key) DO NOTHING - never duplicates, never overwrites Allen's edits, never revives a rejected seed
async function seed() {
  await ensure(5000);
  const rows = seedRows(); let inserted = 0;
  for (let i = 0; i < rows.length; i += 40) {
    const part = rows.slice(i, i + 40), params = [], vals = [];
    part.forEach((r, j) => { const b = j * 7; vals.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, 'approved', 'seed', now(), '${'seed'}')`);
      params.push(r.question, r.norm_key, r.variants, r.keywords, r.answer, r.action, r.area); });
    const got = await sql(`/*answers:seed*/ INSERT INTO spark_answers (question, norm_key, variants, keywords, answer, action, area, status, source, approved_at, env)
      VALUES ${vals.join(', ')} ON CONFLICT (norm_key) DO NOTHING RETURNING id`, params, { timeoutMs: 8000 });
    inserted += got.length;
  }
  resetCache();
  return { total: rows.length, inserted, skipped: rows.length - inserted };
}
module.exports = { WRITTEN_BY, clipHash, CLIP_RE, CLIP_MIN, CLIP_MAX, isMp3, MIGRATE_BASE, MIGRATE_V14, schemaSql, TABLE_SQL, MIGRATE_SQL, statements, AREAS, seedRows, seed, variantsOf, phrase, STATUSES, SOURCES, ACTIONS, MAX_ANSWER, MAX_Q, MATCH_MIN, tokens, normKey, defaultKeywords, cleanKeywords, redact, cleanAnswer,
  score, bestMatch, toAction, ensure, enabled, approved, lookup, logUnanswered, saveGrok, resetCache, sql };
