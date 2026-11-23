// spark14 (Allen 11/14 7:52 PM ET): content-safety rules for answers the daily routine writes for kid questions Spark couldn't answer.
// Pure functions, no DB, no network. Used by /api/spark-answers op 'auto-answer' AND by tools/auto-answer.js (both sides check, so
// neither a buggy script nor a bad draft can put an unsafe line in front of a child). Anything doubtful is LEFT for Allen (never auto-approved).
const B = require('./_spark-brain');
const L = require('./_spark-answers');

const MIN_ANSWER = 20, MAX_SENTENCES = 3, MAX_WORD = 14;
// questions the routine must leave for Allen: personal, grown-up/scary, body/medical, money, religion/politics, people/brands, the game itself
const Q_SENSITIVE = /\b(kill|killed|killing|die|dies|died|dying|dead|death|blood|bloody|gun|guns|shoot|weapon|bomb|war|fight|hurt|pain|scary|scared|ghost|monster|sex|sexy|naked|kiss|boyfriend|girlfriend|baby come from|pregnan\w*|drug|drugs|alcohol|beer|wine|smok\w*|vape|poison|suicide|sad|cry|crying|hate|stupid|dumb|shut up|poop|pee|butt|god|jesus|allah|church|heaven|hell|devil|president|trump|biden|election|money|cost|buy|price|doctor|medicine|sick|cancer|virus|covid)s?\b/;
const Q_PERSONAL = /\[(name|email|number|link)\]|\b(my|your|mom|dad|mommy|daddy|brother|sister|teacher|friend|grandma|grandpa)\b.*\b(name|address|house|home|school|phone|age|birthday|live|password)\b|\b(where do you live|how old are you|are you real|are you a robot|are you (an )?ai|who made you|what'?s your name)\b/;
// about Spark Studio itself (where am I / what to play / how the game works): the game should handle these, so Allen decides
const Q_GAME = /\b(this area|this place|this game|this level|play next|go next|different area|another area|how do i (play|win|get|open|unlock|go)|unlock|level|points?|score|app|website|button|tap|screen|spark studio|what is this|where am i|what am i looking at|looking at)\b/;
// lines an answer must never contain (on top of _spark-answers.cleanAnswer, which strips links/emails/markup/emoji)
const A_BANNED = /\b(kill|killed|die|dies|died|dead|death|blood|gun|weapon|bomb|war|sex|naked|drug|alcohol|beer|wine|smok\w*|poison|suicide|hate|stupid|dumb|scary|ghost|monster|god|devil|hell|money|buy|website|www|http|google|youtube|tiktok|instagram|ai|chatgpt|grok|robot)s?\b|@|\d{5,}/;
// asking the child for anything about themselves, or sending them away from the game / to a stranger
const A_PERSONAL = /\b(your (name|address|school|phone|age|birthday|house|home|password|email)|where do you live|how old are you|tell me (about )?your|send me|message me|ask a stranger|go outside alone)\b/;

const words = s => B.norm(s).split(' ').filter(Boolean);
// question side -> {ok:true} or {ok:false, reason}; 'leave' reasons mean "Allen decides", never auto-answered
function checkQuestion(q) {
  const t = B.norm(q), kw = B.keyword(q, { tab: 'home' });
  if (kw.why === 'personal' || Q_PERSONAL.test(t) || /\[(name|email|number|link)\]/.test(String(q))) return { ok: false, reason: 'personal' };
  if (!t || L.tokens(q).length < 2) return { ok: false, reason: 'unclear' };
  if (kw.why === 'grown-up' || Q_SENSITIVE.test(t)) return { ok: false, reason: 'sensitive' };
  if (kw.type === 'idea') return { ok: false, reason: 'kid-idea' };
  if (B.isCommand(q, kw, { tab: 'home' }) || Q_GAME.test(t)) return { ok: false, reason: 'game-help' };
  return { ok: true };
}
// answer side -> {ok:true, answer:<cleaned line>} or {ok:false, reason}
function checkAnswer(a) {
  const raw = String(a == null ? '' : a).trim();
  if (!raw) return { ok: false, reason: 'answer-empty' };
  if (raw.length > L.MAX_ANSWER) return { ok: false, reason: 'answer-too-long' };
  if (/@|https?:|www\.|\.(com|org|net)\b/i.test(raw) || A_BANNED.test(B.norm(raw))) return { ok: false, reason: 'answer-unsafe-word' };
  const line = L.cleanAnswer(raw);
  if (line.length < MIN_ANSWER) return { ok: false, reason: 'answer-too-short' };
  // cleaning must not have removed real content (emoji/markup/links are not allowed in drafts at all)
  if (line.replace(/\s/g, '').length < raw.replace(/[\s\u{1F000}-\u{1FFFF}\u2600-\u27BF]/gu, '').length - 2) return { ok: false, reason: 'answer-has-disallowed-characters' };
  const t = B.norm(line);
  if (A_BANNED.test(t) || /@|https?:|www\./i.test(raw)) return { ok: false, reason: 'answer-unsafe-word' };
  if (A_PERSONAL.test(t)) return { ok: false, reason: 'answer-asks-personal' };
  const sentences = line.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length > MAX_SENTENCES) return { ok: false, reason: 'answer-too-many-sentences' };
  if (words(line).some(w => w.length > MAX_WORD)) return { ok: false, reason: 'answer-hard-word' };
  if (line === B.SAFE || /\bnot sure\b|\bi don'?t know\b/i.test(line)) return { ok: false, reason: 'answer-not-an-answer' };
  return { ok: true, answer: line };
}
function check(q, a) { const cq = checkQuestion(q); if (!cq.ok) return cq; return checkAnswer(a); }
module.exports = { checkQuestion, checkAnswer, check, MIN_ANSWER, MAX_SENTENCES };
