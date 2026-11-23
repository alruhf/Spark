// GET /api/signals-summary  (header x-signals-key or ?key= must equal SIGNALS_READ_KEY)
// Weekly summary for Vercel Builder: favourites, stuck spots, possible bugs by area and spot, plus spikes vs the prior 7 days.
const crypto = require('crypto');
const { sql, ensure, dbUrl } = require('./_signals-db');
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  const want = process.env.SIGNALS_READ_KEY;
  const got = req.headers['x-signals-key'] || (req.query && req.query.key) || new URL(req.url, 'http://x').searchParams.get('key');
  if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
  if (!want || !got || !same(got, want)) { res.statusCode = 401; return res.end(); }
  if (!dbUrl()) { res.statusCode = 503; res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ error: 'no DATABASE_URL' })); }
  try {
    await ensure();
    const fav = await sql(`SELECT area, spot, enters, players, replays, round(play_ms/60000.0,1) AS minutes FROM spark_signals_weekly WHERE enters>0 ORDER BY players DESC, replays DESC, play_ms DESC LIMIT 15`);
    const stuck = await sql(`SELECT area, spot, stuck, stuck_players, wrong_n, right_n FROM spark_signals_weekly WHERE stuck>0 ORDER BY stuck_players DESC, stuck DESC LIMIT 15`);
    const bugs = await sql(`SELECT area, coalesce(act, spot, src, '-') AS spot, type, kind, max(msg) AS sample, count(*) AS n, count(DISTINCT dev) AS players
      FROM spark_signals WHERE at > now() - interval '7 days' AND type IN ('error','deadtap','lowfps') GROUP BY 1,2,3,4 ORDER BY players DESC, n DESC LIMIT 20`);
    // spikes: this week vs prior 7 days, per area, for errors and stuck (flag when >= 2x and >= 5 events)
    const sp = await sql(`SELECT area, type,
        count(*) FILTER (WHERE at > now() - interval '7 days') AS this_week,
        count(*) FILTER (WHERE at <= now() - interval '7 days' AND at > now() - interval '14 days') AS prior_week,
        count(*) FILTER (WHERE at > now() - interval '1 day') AS last_24h
      FROM spark_signals WHERE at > now() - interval '14 days' AND type IN ('error','stuck','deadtap') GROUP BY 1,2`);
    const spikes = sp.map(r => ({ ...r, this_week: +r.this_week, prior_week: +r.prior_week, last_24h: +r.last_24h }))
      .filter(r => r.this_week >= 5 && r.this_week >= 2 * Math.max(1, r.prior_week) || r.last_24h >= 10 && r.last_24h * 7 >= 3 * Math.max(1, r.prior_week));
    const tot = await sql(`SELECT count(*) AS events, count(DISTINCT dev) AS devices FROM spark_signals WHERE at > now() - interval '7 days'`);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ generated: new Date().toISOString(), window: '7d', totals: tot[0] || {}, favorites: fav, stuck, possibleBugs: bugs, spikes, spikeRows: sp }));
  } catch (e) {
    console.error('signals-summary failed', String(e.message || e).slice(0, 200));
    res.statusCode = 500; res.end();
  }
};
