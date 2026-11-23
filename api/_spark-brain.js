// Spark's "brain" (Allen 11/12): the fixed action list, the keyword matcher (default, zero cost) and the optional AI prompt + schema.
// Shared by /api/spark-ask. The client (spark-actions.js) validates every action again before doing anything.
// Places = only the 5 green playable ones. Challenges mirror spark-map.js (keep in sync when a challenge is added).
const PLACES = {
  earth: { name: 'Earth', aliases: ['earth', 'the earth', 'planet earth', 'world', 'the world', 'globe'] },
  egypt: { name: 'Egypt', aliases: ['egypt', 'ancient egypt', 'egipt', 'eygpt', 'egyp', 'egpyt', 'sahara', 'pharaoh', 'nile', 'pyramids', 'desert'] },
  savannah: { name: 'Savannah', aliases: ['savannah', 'savanna', 'savana', 'savanah', 'savvanah', 'safari', 'africa'] },
  reef: { name: 'Reef', aliases: ['reef', 'coral reef', 'coral', 'reaf', 'reeef', 'great barrier reef', 'barrier reef', 'ocean', 'sea', 'underwater'] },
  arctic: { name: 'Arctic', aliases: ['arctic', 'artic', 'arctik', 'arktic', 'the arctic', 'north pole', 'snow', 'ice'] },
};
const CHALLENGES = {
  egypt: { moses: ['moses', 'plague', 'plagues', 'coin challenge'], pyramid: ['pyramid', 'capstone'], shaduf: ['shaduf', 'water the fields', 'lift water'], stamp: ['stamp', 'scribe', 'stamp booth'] },
  savannah: { rescue: ['rescue', 'radio', 'animal hospital', 'ranger'], read: ['animal card', 'cards', 'read'], observe: ['watch the animals', 'water hole', 'drink'] },
  reef: { trash: ['trash', 'rubbish', 'clean the reef', 'garbage'], 'shark-letters': ['shark', 'letters', 'trace'], survey: ['count the fish', 'fish count', 'survey'] },
  arctic: { igloo: ['igloo', 'snow block', 'snow blocks'], fish: ['ice fishing', 'fishing', 'catch fish'], sled: ['sled', 'dog sled', 'huskies', 'husky'] },
};
const TYPES = ['highlight', 'open', 'point', 'say', 'start', 'hint', 'back', 'cheer', 'idea'];
const SAFE = "Hmm, I'm not sure. Ask me what to do, and I'll pick something fun!";
const LINES = {
  idea: "Great idea! I'll tell the grown-ups who build Spark Studio. Thank you!",
  personal: "Let's keep things like names and homes secret and safe. Want to find a place to play?",
  name: "I'm Spark, your explorer friend! Want to find a place to play?",
  grownup: "That's a great question for a grown-up. Let's go explore together!",
  hint: "Look for something that sparkles or glows, then walk to it and tap!",
  back: "Okay, let's go back!",
  cheer: "You did it! Super job, explorer!",
  hello: "Hi there! I can help you find a place to play, or tell you what to do here.",
};
const norm = s => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
// same phrases as the site's keyword matcher (spark-helper.js)
const FIND = /\b(help me find|find|where'?s|where is|where are|take me to|take me|show me|go to|bring me to|looking for)\b/;
const WHAT = /\b(what can i do|what do i do|what should i do|what should we do|what should we try|what do we do|what can we do|what to do|what now|i'?m bored|i am bored|something to do)\b/;
const IDEA = /\b(can you|could you|will you|would you|you should|i want you to|please)\b.*\b(make|build|add|create|change|paint|turn|put|give|design|invent)\b|\b(i wish|there should be|what if there was|make (it|the|everything|them)|change (it|the)|paint (it|the)|turn (it|the))\b/;
const PERSONAL = /\b(my name is|i live|my address|my school|my phone|phone number|my mom'?s name|my dad'?s name|i'?m \d+ years|my birthday)\b/;
const ASK_NAME = /\b(what'?s your name|what is your name|who are you)\b/;
const GROWNUP = /\b(where do you live|how old are you|are you real|are you a robot|are you (an )?ai|kill|die|dead|blood|gun|scary|sex|drugs?)\b/;
const HINT = /\b(stuck|how do i|i don'?t know how|hint|help me|help)\b/;
const BACK = /\b(go back|back|leave|exit|go home|get out)\b/;
const CHEER = /\b(i did it|yay|i won|i'?m done|finished|look at me|hooray)\b/;
const HELLO = /^(hi|hello|hey|hi spark|hello spark|hey spark)\b/;
function lev(a, b) { if (Math.abs(a.length - b.length) > 2) return 9; const d = []; for (let i = 0; i <= a.length; i++) d[i] = [i]; for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
function matchPlace(t) { const s = ' ' + t + ' ', toks = t.split(' '); let best = null, bs = -1;
  for (const [id, p] of Object.entries(PLACES)) for (const a of p.aliases) { let sc = -1; if (s.includes(' ' + a + ' ')) sc = 200 + a.length;
    else if (!a.includes(' ') && a.length >= 4) for (const w of toks) if (w.length >= 4) { const dd = lev(w, a); if (dd <= (a.length >= 7 ? 2 : 1)) sc = Math.max(sc, 100 + a.length - dd * 5); }
    if (sc > bs) { bs = sc; best = id; } }
  return bs > 0 ? best : null; }
function matchChallenge(t, area) { const s = ' ' + t + ' '; const order = area && CHALLENGES[area] ? [area, ...Object.keys(CHALLENGES).filter(a => a !== area)] : Object.keys(CHALLENGES);
  for (const a of order) for (const [id, kws] of Object.entries(CHALLENGES[a])) if (kws.some(k => s.includes(' ' + k + ' ') || s.includes(' ' + k + 's '))) return { area: a, id };
  return null; }
// Allen 11/15 item 9: "what is this place" / "where am I" answers (keyword only, no AI), and the named spot the kid is standing by.
// spot ids = the pins each 3D world already has (sent by the client from SparkHere.get().spot); unknown ids are ignored.
const HERE = /^(hey |hi |ok |okay )?(spark )?(where am i|where are we|what is this( place| area| spot)?|what'?s this( place| area| spot)?|what place is this|what is here|what'?s here|where is this)( right now| now)?( spark)?$/; // whole question only ('what is this fish' stays a library question)
const ABOUT = {
  egypt: "You're in Ancient Egypt! People here built giant pyramids and farmed beside the Nile River.",
  savannah: "You're on the savannah in Africa! Zebras, giraffes, elephants and hippos live on these wide grassy plains.",
  reef: "You're at the Great Barrier Reef in Australia! Colorful corals and fish live here under the sea.",
  arctic: "You're in the Arctic! It's snowy and icy here, so people build igloos and go ice fishing.",
};
const SPOTS = {
  egypt: { plateau: "You're by the pyramids! They were built long ago with giant stone blocks.", shaduf: "You're by the shaduf! It lifts water from the river to the fields.",
    stable: "You're by the donkey stable! Donkeys helped people carry heavy loads.", stamp: "You're by the stamp booth! Scribes wrote with little pictures called hieroglyphs.",
    farm: "You're by the farm fields! Farmers grew wheat beside the Nile River.", grind: "You're by the grinding stone! It turns wheat into flour.",
    bake: "You're by the bread oven! Bread was part of every meal.", map: "You're by the big map! It shows you where things are." },
  savannah: { radio: "You're by the ranger radio! It tells rangers when an animal needs help.", catalog: "You're by the ranger office! You can shop for things here.",
    clinic: "You're by the animal clinic! Hurt animals get better here.", lodge: "You're by the animal lodge! Animals rest here while they heal.",
    truck: "You're by the rescue truck! Hop in to drive out and help animals." },
  reef: { nursery: "You're by the coral nursery! Baby corals grow here before they go back to the reef.", shop: "You're by the trader's dock! You can buy clothes and things for your cabin.",
    cabin: "You're by your boat cabin! You can decorate it any way you like.", boats: "You're by the boats! Save your coins to ride out to the deep reef.",
    bunk: "You're by your bunk! Tap it to sleep and see the night reef." },
  arctic: { trader: "You're by the trader's stall! You can buy things for your igloo here.", sled: "You're by the dog sled! The huskies are ready to pull you across the snow.",
    fish: "You're by the frozen lake! Drill a hole in the ice and go fishing." },
};
function hereLine(ctx) { const area = ctx && ctx.tab === 'area' ? ctx.area : null; if (!area || !ABOUT[area]) return null;
  const sp = ctx.spot && SPOTS[area][ctx.spot]; return sp || ABOUT[area]; }
// keyword matcher -> one action from the fixed list (no network, no cost)
function keyword(q, ctx) {
  const t = norm(q), area = ctx && ctx.tab === 'area' ? ctx.area : null;
  if (!t) return { type: 'say', line: "Hmm, I didn't hear that. Tap me and try again!" };
  if (PERSONAL.test(t)) return { type: 'say', line: LINES.personal, why: 'personal' };
  if (ASK_NAME.test(t)) return { type: 'say', line: LINES.name };
  if (GROWNUP.test(t)) return { type: 'say', line: LINES.grownup, why: 'grown-up' };
  if (HERE.test(t)) { const h = hereLine(ctx); if (h) return { type: 'say', line: h, why: 'here' }; }
  if (WHAT.test(t)) return { type: 'point' };
  const place = matchPlace(t), ch = matchChallenge(t, area);
  if (FIND.test(t) && place) return { type: 'highlight', place };
  if (IDEA.test(t)) return { type: 'idea', idea: String(q).replace(/\s+/g, ' ').trim().slice(0, 200), line: LINES.idea };
  if (FIND.test(t) && ch) return ch.area === area ? { type: 'point', challenge: ch.id } : { type: 'highlight', place: ch.area };
  if (ch) return ch.area === area ? { type: 'start', challenge: ch.id } : { type: 'highlight', place: ch.area };
  if (place) return { type: 'highlight', place };
  if (CHEER.test(t)) return { type: 'cheer', line: LINES.cheer };
  if (BACK.test(t)) return { type: 'back', line: LINES.back };
  if (HINT.test(t)) return { type: 'hint', line: LINES.hint };
  if (HELLO.test(t)) return { type: 'say', line: LINES.hello };
  return { type: 'say', line: "Hmm, I'm not sure. Ask me what to do, and I'll pick something fun!", why: 'unknown' };
}
// never let a link, email or long text out; kid-sized lines only
function cleanLine(s) { return String(s || '').replace(/https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/gi, '').replace(/[<>{}\[\]`*_#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160); }
function validate(a, ctx) {
  if (!a || typeof a !== 'object' || !TYPES.includes(a.type)) return { type: 'say', line: SAFE, why: 'invalid' };
  const o = { type: a.type === 'open' ? 'highlight' : a.type }; const line = cleanLine(a.line); if (line) o.line = line;
  if (a.type === 'highlight' || a.type === 'open') { if (!PLACES[a.place]) return { type: 'say', line: SAFE, why: 'bad-place' }; o.place = a.place; }
  if (a.type === 'point' || a.type === 'start') { const ar = ctx && ctx.tab === 'area' && CHALLENGES[ctx.area]; if (a.challenge) { if (ar && ar[a.challenge]) o.challenge = a.challenge; else if (a.type === 'start') return { type: 'say', line: SAFE, why: 'bad-challenge' }; } }
  if (a.type === 'idea') { o.idea = String(a.idea || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!o.idea) return { type: 'say', line: SAFE, why: 'empty-idea' }; o.line = LINES.idea; }
  if (a.type === 'say' && !o.line) o.line = SAFE;
  return o;
}
function siteMap(ctx) {
  const here = ctx && ctx.tab === 'area' && ctx.area ? `The child is inside ${PLACES[ctx.area] ? PLACES[ctx.area].name : ctx.area}.` : `The child is on the ${ctx && ctx.tab || 'home'} screen (maps).`;
  const ch = Object.entries(CHALLENGES).map(([a, c]) => `${a}: ${Object.keys(c).join(', ')}`).join('; ');
  return `Places (the only ones that exist): earth, egypt, savannah, reef, arctic. Challenges per place: ${ch}. ${here}`;
}
function systemPrompt(ctx) {
  return `You are Spark, a warm, gentle guide for young children (4-10) in the Spark Studio learning game. Reply ONLY with the JSON object.
Pick exactly ONE action:
- highlight(place): show where a place is and tell the child what to tap (you never take them there; they tap to go).
- point(challenge optional): suggest something to do here (leave challenge empty to let the game pick by level).
- start(challenge): start a challenge in the CURRENT place only.
- hint: a short tip. back: go back. cheer: celebrate. say: a short friendly line.
- idea: the child asks you to make, build, add or change something in the game. You NEVER build anything: thank them and put their idea (short, in their words) in "idea".
${siteMap(ctx)}
Rules: "line" is 1-2 short sentences a 5-year-old understands, warm, no emojis, no links, no lists.
Never ask for or repeat personal information (names, homes, schools, ages, photos). If the child shares some, gently say to keep it safe.
Don't chat about things outside the game; gently steer back to playing. Scary or grown-up topics: say it's a question for a grown-up.
Never say you are an AI or name any company. Use only the places and challenges listed above.`;
}
const SCHEMA = { type: 'object', additionalProperties: false, required: ['type', 'place', 'challenge', 'line', 'idea'],
  properties: { type: { type: 'string', enum: TYPES }, place: { type: 'string', enum: ['', ...Object.keys(PLACES)] }, challenge: { type: 'string' }, line: { type: 'string' }, idea: { type: 'string' } } };
// spark11: is this a game command (find/take me to a place, what can I do, back, hint, cheer, start)? Saved answers never override these.
const COMMAND_TYPES = ['point', 'back', 'cheer', 'hint', 'start'];
function isCommand(q, kw, ctx) { const t = norm(q); return kw.why === 'here' || COMMAND_TYPES.includes(kw.type) || WHAT.test(t) || (FIND.test(t) && kw.type === 'highlight') || ((HINT.test(t) || FIND.test(t) || /\b(let'?s|i want to|can i|start|play)\b/.test(t)) && !!matchChallenge(t, ctx && ctx.tab === 'area' ? ctx.area : null)); } // find/take me to + a place
module.exports = { ABOUT, SPOTS, HERE, PLACES, CHALLENGES, TYPES, LINES, SAFE, keyword, validate, cleanLine, systemPrompt, SCHEMA, norm, FIND, WHAT, isCommand };
