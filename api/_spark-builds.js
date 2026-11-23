// spark11 (Allen 8:47 PM): "Build ideas" - possible builds/features for Allen and the team, shown in Spark Insights.
// Table spark_build_ideas in the same Neon Postgres (DATABASE_URL). The Insights DB login is read-only, so every write goes
// through the Spark Studio admin API (/api/spark-answers, SPARK_ANSWERS_KEY). Also reads the kid ideas (spark_ideas, from /api/spark-idea).
const { sql: rawSql } = require('./_signals-db');
const sql = (q, p) => rawSql(q, p || [], { timeoutMs: 5000 });
const STATUSES = ['idea', 'planned', 'building', 'done'];
const MAX_TITLE = 120, MAX_NOTES = 2000;
const TABLE_SQL = `CREATE TABLE IF NOT EXISTS spark_build_ideas (
  id bigserial PRIMARY KEY,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 2000),
  area text,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','planned','building','done')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','seed','kid-idea')),
  kid_idea_id bigint UNIQUE,
  seed_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS spark_build_ideas_status ON spark_build_ideas (status, updated_at DESC)`;
// backlog seeds (Allen 8:48 PM): status planned or idea; seed_key keeps re-seeding idempotent
const SEEDS = [
  { key: 'grok-connection', title: 'Connect Spark to Grok', area: 'general', status: 'planned', notes: 'Turn on SPARK_AI_ENABLED with an xAI key (daily cap + monthly spend limit). Library answers still come first; Grok answers land as pending for review.' },
  { key: 'server-ava-voice', title: 'Server-side Ava voice', area: 'general', status: 'idea', notes: 'Generate Spark lines with the Ava voice on the server so every device sounds the same, cached as mp3.' },
  { key: 'voice-unification', title: 'Voice unification', area: 'general', status: 'planned', notes: 'One voice path for captions, intros and answers so nothing plays twice or in two voices.' },
  { key: 'parent-accounts', title: 'Parent accounts (Supabase), 5 kids max', area: 'general', status: 'idea', notes: 'Grown-up sign-in with Supabase; each parent account holds up to 5 kid profiles that sync across devices.' },
  { key: 'back-to-continent', title: 'Back goes to the continent in Egypt, Reef and Arctic', area: 'general', status: 'planned', notes: 'Like the Savannah: Back from Egypt returns to the Africa map, Reef to Australia, Arctic to North America (not the Solar System).' },
];
const COLS = 'id, title, notes, area, status, source, kid_idea_id, seed_key, created_at, updated_at';
let ready = null;
function ensure() {
  if (!ready) ready = (async () => { for (const q of TABLE_SQL.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)) await sql(q); })().catch(e => { ready = null; throw e; });
  return ready;
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n);
// validate title/notes/area/status; returns {err} or clean fields (only the ones given, unless need)
function fields(b, need, areas) {
  const o = {};
  if (b.title !== undefined || need) { const t = String(b.title == null ? '' : b.title).trim(); if (!t) return { err: 'title_required' }; if (t.length > MAX_TITLE) return { err: 'title_too_long' }; o.title = clean(t, MAX_TITLE); }
  if (b.notes !== undefined) { if (String(b.notes || '').length > MAX_NOTES) return { err: 'notes_too_long' }; o.notes = clean(b.notes, MAX_NOTES); }
  if (b.area !== undefined) { if (b.area && !areas.includes(b.area)) return { err: 'bad_area' }; o.area = b.area || null; }
  if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return { err: 'bad_status' }; o.status = b.status; }
  return o;
}
async function list(status, area) {
  await ensure();
  const rows = await sql(`/*builds:list*/ SELECT ${COLS} FROM spark_build_ideas WHERE ($1::text IS NULL OR status = $1::text) AND ($2::text IS NULL OR area = $2::text)
    ORDER BY array_position(ARRAY['building','planned','idea','done'], status), updated_at DESC LIMIT 500`, [status || null, area || null]);
  const counts = await sql(`/*builds:counts*/ SELECT status, count(*)::int AS n FROM spark_build_ideas GROUP BY 1`);
  return { rows, counts, statuses: STATUSES.slice() };
}
async function add(f) {
  await ensure();
  const r = await sql(`/*builds:add*/ INSERT INTO spark_build_ideas (title, notes, area, status, source) VALUES ($1, $2, $3, $4, 'manual') RETURNING ${COLS}`, [f.title, f.notes || '', f.area || null, f.status || 'idea']);
  return r[0];
}
async function get(id) { await ensure(); const r = await sql(`/*builds:get*/ SELECT ${COLS} FROM spark_build_ideas WHERE id = $1`, [id]); return r[0] || null; }
async function edit(id, f) {
  const cur = await get(id); if (!cur) return null; const n = { ...cur, ...f };
  const r = await sql(`/*builds:edit*/ UPDATE spark_build_ideas SET title = $2, notes = $3, area = $4, status = $5, updated_at = now() WHERE id = $1 RETURNING ${COLS}`, [id, n.title, n.notes || '', n.area || null, n.status]);
  return r[0];
}
async function remove(id) { await ensure(); const r = await sql(`/*builds:delete*/ DELETE FROM spark_build_ideas WHERE id = $1 RETURNING id`, [id]); return r.length ? +r[0].id : null; }
async function seed() {
  await ensure(); const params = [], vals = [];
  SEEDS.forEach((s, j) => { const b = j * 5; vals.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, 'seed', $${b + 5})`); params.push(s.title, s.notes, s.area, s.status, s.key); });
  const got = await sql(`/*builds:seed*/ INSERT INTO spark_build_ideas (title, notes, area, status, source, seed_key) VALUES ${vals.join(', ')} ON CONFLICT (seed_key) DO NOTHING RETURNING id`, params);
  return { total: SEEDS.length, inserted: got.length, skipped: SEEDS.length - got.length };
}
// "Make build idea" from a kid idea: copies it once (kid_idea_id UNIQUE); a second press returns the existing row
async function fromKidIdea(ideaId, areas) {
  await ensure();
  let idea; try { idea = (await sql(`/*ideas:get*/ SELECT id, at, idea, area, tag FROM spark_ideas WHERE id = $1`, [ideaId]))[0]; } catch (e) { idea = null; }
  if (!idea) return null;
  const title = clean(idea.idea, MAX_TITLE) || 'Kid idea', area = areas.includes(idea.area) ? idea.area : null;
  const notes = 'From a kid idea' + (idea.at ? ' (' + String(new Date(idea.at).toISOString()).slice(0, 10) + ')' : '') + (idea.area ? ', asked in ' + clean(idea.area, 30) : '') + '.';
  const r = await sql(`/*builds:fromidea*/ INSERT INTO spark_build_ideas (title, notes, area, status, source, kid_idea_id) VALUES ($1, $2, $3, 'idea', 'kid-idea', $4)
    ON CONFLICT (kid_idea_id) DO NOTHING RETURNING ${COLS}`, [title, notes, area, +idea.id]);
  if (r.length) return { created: true, row: r[0] };
  const ex = await sql(`/*builds:bykid*/ SELECT ${COLS} FROM spark_build_ideas WHERE kid_idea_id = $1`, [+idea.id]);
  return { created: false, row: ex[0] || null };
}
// kid ideas (read-only): newest first, test rows hidden unless asked, "similar" = other ideas with the same words, build_id if copied
const ideaKey = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
async function kidIdeas(showTest, limit) {
  await ensure();
  let rows;
  try { rows = await sql(`/*ideas:list*/ SELECT i.id, i.at, i.idea, i.area, i.tag, b.id AS build_id FROM spark_ideas i LEFT JOIN spark_build_ideas b ON b.kid_idea_id = i.id
      WHERE ($1::boolean OR i.tag <> 'test') ORDER BY i.at DESC LIMIT $2::int`, [!!showTest, Math.max(1, Math.min(500, limit || 200))]); }
  catch (e) { if (/spark_ideas/.test(String(e.message || e))) return { rows: [], missing: true }; throw e; } // no kid ideas yet (table not created) -> empty list
  const n = {}; rows.forEach(r => { const k = ideaKey(r.idea); n[k] = (n[k] || 0) + 1; });
  return { rows: rows.map(r => ({ ...r, similar: n[ideaKey(r.idea)] - 1 })), missing: false };
}
module.exports = { TABLE_SQL, STATUSES, SEEDS, MAX_TITLE, MAX_NOTES, ensure, fields, list, add, get, edit, remove, seed, fromKidIdea, kidIdeas };
