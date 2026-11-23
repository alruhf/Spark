/* Jupiter & Saturn sky clock for Spark Studio. Does not change Savannah or other planet answers. */
(() => {
  'use strict';
  const DEG = Math.PI / 180;
  const J2000 = Date.UTC(2000, 0, 1, 12);
  const MEETINGS = [
    { id: '1623', year: '1623', date: '16 Jul 1623', ms: Date.UTC(1623, 6, 16, 12), observed: '5′', note: 'Closest in centuries. Daylight hid it.' },
    { id: '1961', year: '1961', date: '18 Feb 1961', ms: Date.UTC(1961, 1, 18, 12), observed: '14′', note: 'A tight evening pair.' },
    { id: '2000', year: '2000', date: '28 May 2000', ms: Date.UTC(2000, 4, 28, 12), observed: '69′', note: 'A wide meeting you could split by eye.' },
    { id: '2020', year: '2020', date: '21 Dec 2020', ms: Date.UTC(2020, 11, 21, 18), observed: '6.1′', note: 'The Great Conjunction. Closest since 1623.' },
    { id: '2040', year: '2040', date: '31 Oct 2040', ms: Date.UTC(2040, 9, 31, 12), observed: '72′', note: 'The next meeting. Wider than 2020.' }
  ];
  const BODIES = {
    earth: { a: 1.00000261, e: 0.01671123, I: 0, L0: 100.46457166, w: 102.93768193, O: 0, n: 35999.37244981 },
    jupiter: { a: 5.202887, e: 0.04838624, I: 1.30439695, L0: 34.39644051, w: 14.72847983, O: 100.47390909, n: 3034.74612775 },
    saturn: { a: 9.53667594, e: 0.05386179, I: 2.48599187, L0: 49.95424423, w: 92.59887831, O: 113.66242448, n: 1222.49362201 }
  };

  function wrap(rad) { return ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); }
  function solveE(M, e) {
    let E = M;
    for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return E;
  }
  function place(el, ms) {
    const days = (ms - J2000) / 86400000;
    const L = el.L0 * DEG + (el.n * DEG / 36525) * days;
    const arg = el.w - el.O;
    const M = wrap(L - el.w * DEG);
    const E = solveE(M, el.e);
    const nu = Math.atan2(Math.sqrt(1 - el.e * el.e) * Math.sin(E), Math.cos(E) - el.e);
    const r = el.a * (1 - el.e * Math.cos(E));
    const u = nu + arg * DEG;
    const cO = Math.cos(el.O * DEG), sO = Math.sin(el.O * DEG);
    const cu = Math.cos(u), su = Math.sin(u), cI = Math.cos(el.I * DEG), sI = Math.sin(el.I * DEG);
    return { x: r * (cO * cu - sO * su * cI), y: r * (sO * cu + cO * su * cI), z: r * su * sI };
  }
  function ang(a, b) {
    const d = a.x * b.x + a.y * b.y + a.z * b.z;
    const m = Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z);
    return Math.acos(Math.min(1, Math.max(-1, d / (m || 1))));
  }
  function sky(ms) {
    const earth = place(BODIES.earth, ms);
    const jupiter = place(BODIES.jupiter, ms);
    const saturn = place(BODIES.saturn, ms);
    const ej = { x: jupiter.x - earth.x, y: jupiter.y - earth.y, z: jupiter.z - earth.z };
    const es = { x: saturn.x - earth.x, y: saturn.y - earth.y, z: saturn.z - earth.z };
    const sep = ang(ej, es);
    const later = skySep(ms + 40 * 86400000);
    return { earth, jupiter, saturn, sep, closing: later < sep };
  }
  function skySep(ms) {
    const earth = place(BODIES.earth, ms);
    const jupiter = place(BODIES.jupiter, ms);
    const saturn = place(BODIES.saturn, ms);
    return ang(
      { x: jupiter.x - earth.x, y: jupiter.y - earth.y, z: jupiter.z - earth.z },
      { x: saturn.x - earth.x, y: saturn.y - earth.y, z: saturn.z - earth.z }
    );
  }
  function formatSep(rad) {
    const arcmin = Math.abs(rad) * (180 / Math.PI) * 60;
    if (arcmin < 120) return (arcmin < 10 ? arcmin.toFixed(1) : arcmin.toFixed(0)) + '′';
    return (arcmin / 60).toFixed(2) + '°';
  }
  function orbit(el) {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const E = (i / 140) * Math.PI * 2;
      const nu = Math.atan2(Math.sqrt(1 - el.e * el.e) * Math.sin(E), Math.cos(E) - el.e);
      const r = el.a * (1 - el.e * Math.cos(E));
      const u = nu + (el.w - el.O) * DEG;
      const cO = Math.cos(el.O * DEG), sO = Math.sin(el.O * DEG), cu = Math.cos(u), su = Math.sin(u), cI = Math.cos(el.I * DEG);
      pts.push({ x: r * (cO * cu - sO * su * cI), y: r * (sO * cu + cO * su * cI) });
    }
    return pts;
  }
  const RINGS = { earth: orbit(BODIES.earth), jupiter: orbit(BODIES.jupiter), saturn: orbit(BODIES.saturn) };

  function band() {
    const age = Number(window.S?.age) || 6;
    return age <= 6 ? '4-6' : age <= 9 ? '7-9' : age <= 12 ? '10-12' : '13-15';
  }
  function promptFor(level) {
    if (level === '4-6') return { q: 'Which two planets can stand almost on top of each other in our sky?', a: 'Jupiter and Saturn', c: ['Jupiter and Saturn', 'Mars and Mercury', 'Earth and the Sun'], hint: 'Look at the two giant planets on this sky clock.' };
    if (level === '7-9') return { q: 'About how often do Jupiter and Saturn line up in our sky?', a: 'About every 20 years', c: ['About every 20 years', 'Every night', 'Once every thousand years'], hint: 'Count the years between the meetings on the filmstrip.' };
    if (level === '10-12') return { q: 'Which meeting was only about 6 arcminutes apart?', a: '21 December 2020', c: ['21 December 2020', '28 May 2000', '31 October 2040'], hint: 'The closest meeting since 1623 is marked 6.1′.' };
    return { q: 'Why can one conjunction look much closer than another?', a: 'They can share a direction and also sit at nearly the same height in the sky', c: ['They can share a direction and also sit at nearly the same height in the sky', 'Saturn stops moving for twenty years', 'They become the same planet'], hint: 'Direction is not the only clue. Height above the path matters too.' };
  }

  let root, canvas, ctx, ms = MEETINGS[3].ms, answered = false;

  function draw() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 320;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, w, h);
    const state = sky(ms);
    const scale = Math.min(w, h) * 0.042;
    const cx = w * 0.5, cy = h * 0.52;
    const xy = (p) => [cx + p.x * scale, cy - p.y * scale];
    const ring = (pts, color) => {
      ctx.beginPath();
      pts.forEach((p, i) => { const [x, y] = xy(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };
    ring(RINGS.earth, '#7feeff55');
    ring(RINGS.jupiter, '#e7c48a88');
    ring(RINGS.saturn, '#f3e2b088');
    const dot = (p, r, fill, label) => {
      const [x, y] = xy(p);
      ctx.beginPath();
      ctx.fillStyle = fill;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (label) {
        ctx.fillStyle = '#e7f3ff';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.fillText(label, x + r + 4, y - r);
      }
    };
    dot({ x: 0, y: 0 }, 7, '#ffb14a', '');
    dot(state.earth, 4, '#7ec8ff', 'Earth');
    dot(state.jupiter, 8, '#e7c48a', 'Jupiter');
    dot(state.saturn, 7, '#f3e2b0', 'Saturn');
    const [sx, sy] = xy(state.saturn);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(-0.45);
    ctx.beginPath();
    ctx.strokeStyle = '#f3e2b0';
    ctx.lineWidth = 1.4;
    ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function paintReadout() {
    const state = sky(ms);
    const near = MEETINGS.find((m) => Math.abs(ms - m.ms) < 40 * 86400000);
    const gap = root.querySelector('[data-gap]');
    const observed = root.querySelector('[data-observed]');
    const plain = root.querySelector('[data-plain]');
    if (gap) gap.textContent = formatSep(state.sep);
    if (observed) observed.textContent = near ? `Observed that day ${near.observed} · ${near.date}` : 'Model gap in the sky. Tap a meeting to compare it with the observed gap.';
    if (plain) plain.textContent = state.sep < 0.01 ? 'They share nearly the same point of light.' : state.closing ? 'They are drawing together.' : 'They are drifting apart.';
    root.querySelectorAll('.conjunction-film button').forEach((b) => b.classList.toggle('on', near && b.dataset.id === near.id));
  }

  function ask() {
    const level = band();
    const item = promptFor(level);
    const box = root.querySelector('[data-ask]');
    answered = false;
    const choices = [...item.c].sort(() => Math.random() - 0.5);
    box.innerHTML = `<p>${item.q}</p><div class="conjunction-choices">${choices.map((c) => `<button type="button" data-v="${c.replace(/"/g, '"')}">${c}</button>`).join('')}</div><p class="conjunction-note">Ask Spark for a hint if you want one. The answer stays hidden until you choose.</p>`;
    box.querySelectorAll('button').forEach((btn) => {
      btn.onclick = () => {
        if (answered) return;
        window.SparkCompanion?.stop?.();
        if (btn.dataset.v === item.a) {
          answered = true;
          btn.classList.add('correct');
          box.querySelectorAll('button').forEach((b) => { b.disabled = true; });
          window.SparkCompanion?.speak?.(`You got it right! Nice work! ${item.a}.`);
        } else {
          btn.classList.add('wrong');
          window.SparkCompanion?.speak?.('That choice does not fit the clue yet. Try again, or ask Spark for a hint.');
        }
      };
    });
    window.SparkCompanion?.updateContext?.({ challenge: 'jupiter-saturn-meeting', challengeData: { prompt: item.q, hint: item.hint, explanation: item.a, teachingGoal: 'Compare Jupiter and Saturn meetings' } });
  }

  function shell() {
    root.innerHTML = `<p class="conjunction-kicker">Great Conjunction</p><h3>Jupiter & Saturn</h3><p class="conjunction-lead">They meet in our sky about every 20 years. 21 December 2020 was the closest since 1623.</p><div class="conjunction-stage"><div class="conjunction-sky"><canvas aria-label="Jupiter and Saturn orbits"></canvas></div><div class="conjunction-readout"><p class="label">Model gap</p><p class="gap" data-gap>—</p><p class="observed" data-observed></p><p class="plain" data-plain></p></div></div><div class="conjunction-film"></div><div class="conjunction-ask" data-ask></div>`;
    const film = root.querySelector('.conjunction-film');
    film.innerHTML = MEETINGS.map((m) => `<button type="button" data-id="${m.id}"><strong>${m.year}</strong><span>${m.observed}</span><small>${m.note}</small></button>`).join('');
    film.querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        const hit = MEETINGS.find((m) => m.id === b.dataset.id);
        ms = hit.ms;
        draw();
        paintReadout();
        window.SparkCompanion?.speak?.(`${hit.date}. Observed gap ${hit.observed}. ${hit.note}`);
      };
    });
    canvas = root.querySelector('canvas');
    ctx = canvas.getContext('2d');
    ask();
    draw();
    paintReadout();
  }

  function mount(name) {
    root = document.getElementById('conjunctionDeck');
    if (!root) return;
    const show = name === 'Jupiter' || name === 'Saturn';
    root.classList.toggle('hidden', !show);
    if (!show) return;
    ms = MEETINGS[3].ms;
    shell();
  }

  window.addEventListener('spark:agechange', () => {
    if (!root || root.classList.contains('hidden')) return;
    ask();
  });
  window.addEventListener('resize', () => { if (root && !root.classList.contains('hidden')) draw(); });
  window.SparkConjunction = { mount };
  if (window.S?.planet) mount(window.S.planet);
})();
