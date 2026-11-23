// POST /api/spark-ask  {q, area, tab, spot, dev}  (spot = named landmark id near the kid, item 9)  ->  {mode, model, action:{type,...}, line, answer}
// Allen 11/12: the real-AI Spark, SWITCHED OFF by default. Allen 11/13 (1:38 PM call): Grok only, xAI API direct.
// The model is called ONLY when env SPARK_AI_ENABLED === '1' AND env XAI_API_KEY is set (Preview only, never Production yet).
// Off (default) or no key: the keyword matcher in _spark-brain.js picks the action - the whole flow works end to end at zero AI cost.
// On: POST https://api.x.ai/v1/chat/completions directly (no Vercel AI Gateway, no Gateway credits, no backup model),
// model grok-4.20-0309-non-reasoning (Grok 4.20 non-reasoning; override only via env SPARK_XAI_MODEL), structured JSON output
// (one action from the fixed list + a short line), tiny max tokens, one question per tap (no chat history), per-device rate limit and daily caps.
// If the xAI call fails, times out or returns bad JSON, the keyword matcher answers (mode 'off-fallback').
// The client validates the action again (spark-actions.js). The API key is never logged or stored here.
// Allen 11/13 8:01 PM - saved answer library (_spark-answers.js, table spark_answers, text only):
//   order = [privacy/idea guard] -> APPROVED library answer (mode 'library', free) -> Grok (only if switched on) -> keyword matcher.
//   A question nothing could answer (keyword 'unknown') is saved as a 'pending' / 'kid-unanswered' row for Allen to answer in Insights
//   (deduped by normalized words, hits bumped). Grok answers (when Grok is on) are saved as 'pending' / 'grok' rows. Only 'approved'
//   rows are ever said to a child. Personal-info sentences and kid ideas never touch the library. DB trouble never breaks answering.
const B = require('./_spark-brain');
const L = require('./_spark-answers');
const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_MODEL_DEFAULT = 'grok-4.20-0309-non-reasoning'; // docs.x.ai/docs/models/grok-4.20-0309-non-reasoning (alias grok-4.20-non-reasoning)
const xaiModel = () => String(process.env.SPARK_XAI_MODEL || '').trim() || XAI_MODEL_DEFAULT;
const MAXQ = 200, MIN = 60000, DAY = 864e5;
const PER_DEV_MIN = 6, PER_DEV_DAY = 80, PER_IP_MIN = 30;
const AI_DAY_CAP = Math.max(0, Number(process.env.SPARK_AI_DAILY_CAP || 2000)); // per server instance; the hard money cap is the xAI key's monthly spend limit
const hits = new Map(); let aiDay = { d: '', n: 0 };
function count(key, win) { const now = Date.now(), h = (hits.get(key) || []).filter(t => now - t < win); h.push(now); hits.set(key, h); if (hits.size > 20000) hits.clear(); return h.length; }
async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let d = typeof req.body === 'string' ? req.body : '';
  if (!d) { let size = 0; for await (const c of req) { size += c.length; if (size > 4096) throw new Error('big'); d += c; } }
  return JSON.parse(d || '{}');
}
const send = (res, code, o) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(o)); };
// pull the action object out of the model text: plain JSON, ```json fences, or the first {...} block
function parseAction(txt) {
  if (typeof txt !== 'string' || !txt.trim()) throw new Error('empty');
  let t = txt.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { const o = JSON.parse(t); if (o && typeof o === 'object' && !Array.isArray(o)) return o; } catch (e) {}
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i >= 0 && j > i) { const o = JSON.parse(t.slice(i, j + 1)); if (o && typeof o === 'object' && !Array.isArray(o)) return o; }
  throw new Error('bad-json');
}
async function askModel(q, ctx) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error('no-xai-key');
  const model = xaiModel();
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(XAI_URL, { method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
      body: JSON.stringify({ model, max_tokens: 120, temperature: 0.3,
        messages: [{ role: 'system', content: B.systemPrompt(ctx) }, { role: 'user', content: q }],
        response_format: { type: 'json_schema', json_schema: { name: 'spark_action', strict: true, schema: B.SCHEMA } } }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('xai ' + r.status);
    const txt = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    const a = parseAction(txt);
    if (a.type === 'idea' && !a.idea) a.idea = q;
    return { action: a, model: j.model || model };
  } finally { clearTimeout(timer); }
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return send(res, 405, { error: 'POST only' }); }
  let body; try { body = await readJson(req); } catch (e) { return send(res, 400, { error: 'bad json' }); }
  const q = String(body.q || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAXQ);
  const ctx = { tab: String(body.tab || 'home').slice(0, 16), area: String(body.area || '').slice(0, 20), spot: /^[a-z-]{1,20}$/.test(String(body.spot || '')) ? String(body.spot) : '' };
  const dev = /^[a-z0-9]{8,40}$/i.test(String(body.dev || '')) ? String(body.dev) : null;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const slow = { mode: 'limit', action: { type: 'say', line: "Let's take a little break. Ask me again in a minute!" } };
  // Allen 11/15 10:23 PM: the rate limits guard the xAI call ONLY. Keyword and saved-library answers cost nothing,
  // are never counted and never get the 'little break' 429 (limit values unchanged; checked just before the xAI request).
  const limited = () => count('ip:' + ip, MIN) > PER_IP_MIN || (dev && (count('m:' + dev, MIN) > PER_DEV_MIN || count('d:' + dev, DAY) > PER_DEV_DAY));
  const kw = B.keyword(q, ctx);
  let action = kw, mode = 'off', model = null;
  const area = ctx.tab === 'area' && B.PLACES[ctx.area] ? ctx.area : null;
  // spark11: the library answers FACT questions only - never personal info, grown-up topics, kid ideas, or game commands
  // ('take me to the arctic', 'where is egypt', 'what can I do', 'go back', 'I did it', 'how do I build the igloo') - those keep the game's own action.
  const useLibrary = !!q && kw.why !== 'personal' && kw.why !== 'grown-up' && kw.type !== 'idea' && !B.isCommand(q, kw, ctx);
  let lib = null;
  if (useLibrary) { try { lib = await L.lookup(q); } catch (e) { lib = null; } }
  if (lib) { action = lib.action; mode = 'library'; }
  // item 9: 'what is this place' answers are fixed keyword lines with Ava clips - never sent to xAI, never counted
  else if (q && kw.why !== 'here' && process.env.SPARK_AI_ENABLED === '1' && process.env.XAI_API_KEY) {
    const today = new Date().toISOString().slice(0, 10); if (aiDay.d !== today) aiDay = { d: today, n: 0 };
    if (aiDay.n < AI_DAY_CAP) {
      if (limited()) return send(res, 429, { ...slow, line: slow.action.line, answer: slow.action.line });
      aiDay.n++;
      try { const r = await askModel(q, ctx); action = r.action; model = r.model; mode = 'ai'; }
      catch (e) { mode = 'off-fallback'; console.error('spark-ask: model failed', String(e.message || e).slice(0, 80)); }
    } else mode = 'off-cap';
  }
  const a = B.validate(action, ctx);
  // feed the library - only questions the free keyword matcher can't handle (not "take me to the reef"-style commands).
  // Both helpers never throw and give up after ~0.8 s.
  if (useLibrary && !lib && kw.why === 'unknown') {
    if (mode === 'ai') { if (a.line && a.line !== B.SAFE && !a.why) await L.saveGrok(q, a, area); }
    else await L.logUnanswered(q, area);
  }
  // spark14: an auto-written library answer is spoken from its DB Ava clip (client: DB clip -> baked clip -> caption; never the browser voice)
  const clip = mode === 'library' && lib && lib.clip && L.CLIP_RE.test(lib.clip) && a.type === 'say' ? '/api/spark-clip?h=' + lib.clip : null;
  return send(res, 200, { mode, model, action: a, line: a.line || null, answer: a.line || null, clip });
};
