import { MATCHES, TEAMS, match, rng, squad, isThreeWay } from './data.js';

// ---------- odds state (shared by every page) ----------
export const ODDS = new Map(); // selId -> { v, dir: 'up'|'down'|null, ts }
export const SUSP = new Set(); // 'matchId|marketId'
export const SUSP_MATCH = new Map(); // matchId -> reason
const listeners = new Set();
export const onOdds = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = (ev) => listeners.forEach((fn) => fn(ev));

const LOAD = Date.now();
let paused = false;
let pausedAt = 0;
let pausedTotal = 0;
export function setPaused(p) {
  if (p === paused) return;
  paused = p;
  if (p) pausedAt = Date.now();
  else pausedTotal += Date.now() - pausedAt;
}
export const isPaused = () => paused;
export const elapsed = () => ((paused ? pausedAt : Date.now()) - LOAD - pausedTotal) / 1000;

export const round = (v) => {
  v = Math.max(1.01, Math.min(51, v));
  if (v < 2) return Math.round(v * 100) / 100;
  if (v < 5) return Math.round(v * 20) / 20;
  if (v < 10) return Math.round(v * 10) / 10;
  return Math.round(v * 2) / 2;
};
const price = (p, margin = 1.065) => round(1 / Math.max(0.0099, p * margin));

// ---------- live clock / score ----------
export function liveInfo(mt) {
  const e = elapsed();
  if (!mt.live) return null;
  if (mt.sport === 'football') {
    const s = mt.clock + e;
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ht = min >= 45 ? '2nd half' : '1st half';
    let short = `${min + 1}’`;
    let long = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    if (min >= 90) {
      const add = Math.min(min - 90 + 1, 5);
      short = `90+${add}’`;
      long = `90:00 +${add}`;
    }
    return { short, long, period: ht, min, frac: Math.min(1, s / (90 * 60)), score: mt.score };
  }
  if (mt.sport === 'basketball') {
    const s = Math.max(0, mt.qclock - e);
    const t = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    return { short: `Q${mt.quarter} ${t}`, long: t, period: `Quarter ${mt.quarter}`, frac: (mt.quarter - 1 + (720 - s) / 720) / 4, score: mt.score };
  }
  if (mt.sport === 'icehockey') {
    const s = Math.max(0, mt.pclock - e);
    const t = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    return { short: `P${mt.period} ${t}`, long: t, period: `Period ${mt.period}`, frac: (mt.period - 1 + (1200 - s) / 1200) / 3, score: mt.score };
  }
  if (mt.sport === 'tennis') {
    const set = mt.sets.length;
    const cur = mt.sets[set - 1];
    return { short: `Set ${set}`, long: `${mt.points[0]}–${mt.points[1]}`, period: `Set ${set}`, frac: set / 3,
      score: [mt.sets.filter(([a, b]) => a > b && (a >= 6)).length, mt.sets.filter(([a, b]) => b > a && b >= 6).length], games: cur, sets: mt.sets, points: mt.points };
  }
  if (mt.sport === 'esports') {
    return { short: `Map ${mt.mapNo}`, long: `${mt.rounds[0]}–${mt.rounds[1]}`, period: `Map ${mt.mapNo} · rounds ${mt.rounds[0]}–${mt.rounds[1]}`, frac: mt.mapNo / 3, score: mt.maps };
  }
  return null;
}

// ---------- football model (Poisson on remaining time) ----------
const pois = (l, k) => { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; };
function grid(lh, la, g0 = [0, 0]) {
  const out = [];
  for (let h = 0; h <= 8; h++) for (let a = 0; a <= 8; a++) out.push({ h: h + g0[0], a: a + g0[1], p: pois(lh, h) * pois(la, a) });
  return out;
}
const sum = (g, f) => g.reduce((s, c) => (f(c) ? s + c.p : s), 0);

function fbModel(mt) {
  const H = TEAMS[mt.home], A = TEAMS[mt.away];
  const d = (H.str - A.str + 2) / 30;
  const info = liveInfo(mt);
  const f = info ? Math.max(0.03, (90 - Math.min(info.min, 89.5)) / 90) : 1;
  const live = info ? 1.4 : 1; // in-play goal rate runs hotter than the pre-match average
  const lh = 1.45 * Math.exp(0.5 * d) * f * live;
  const la = 1.15 * Math.exp(-0.5 * d) * f * live;
  const g0 = info ? mt.score : [0, 0];
  return { lh, la, g0, g: grid(lh, la, g0), f, info };
}

// market: { id, name, cols, outcomes:[{label, p}] , kind? }
function footballMarkets(mt) {
  const H = TEAMS[mt.home], A = TEAMS[mt.away];
  const { g, g0, lh, la, info } = fbModel(mt);
  const tot = g0[0] + g0[1];
  const r = rng('mk' + mt.id);
  let ph = sum(g, (c) => c.h > c.a), pd = sum(g, (c) => c.h === c.a), pa = Math.max(0, 1 - ph - pd);
  if (info) { // in-play calibration: flatten extremes so prices sit where a trader would hang them
    const k = 0.62, t = ph ** k + pd ** k + pa ** k;
    [ph, pd, pa] = [ph ** k / t, pd ** k / t, pa ** k / t];
  }
  const ou = (line) => { const o = sum(g, (c) => c.h + c.a > line); return [{ label: `Over ${line}`, p: o }, { label: `Under ${line}`, p: 1 - o }]; };
  const lines = [0.5, 1.5, 2.5, 3.5, 4.5].filter((l) => l > tot);
  const btts = sum(g, (c) => c.h > 0 && c.a > 0);
  const nextNone = Math.exp(-(lh + la));
  const nH = (1 - nextNone) * (lh / (lh + la));
  const M = [];
  const add = (group, id, name, outcomes, cols = outcomes.length, extra = {}) => M.push({ group, id, name, outcomes, cols, ...extra });

  // Popular
  add('Popular', 'mr', 'Match result', [{ label: H.name, short: H.nick, p: ph }, { label: 'Draw', p: pd }, { label: A.name, short: A.nick, p: pa }]);
  add('Popular', 'dc', 'Double chance', [{ label: `${H.short} or draw`, p: ph + pd }, { label: `${H.short} or ${A.short}`, p: ph + pa }, { label: `Draw or ${A.short}`, p: pd + pa }]);
  add('Popular', info ? 'ng' : 'fs', info ? `Next goal (goal ${tot + 1})` : 'Team to score first', [{ label: H.name, short: H.nick, p: nH }, { label: 'No goal', p: nextNone }, { label: A.name, short: A.nick, p: 1 - nH - nextNone }]);
  add('Popular', 'btts', 'Both teams to score', [{ label: 'Yes', p: btts }, { label: 'No', p: 1 - btts }], 2, g0[0] > 0 && g0[1] > 0 ? { closed: 'Settled: both teams have scored.' } : {});
  if (tot < 2.5) add('Popular', 'tg25', 'Total goals · Over/Under 2.5', ou(2.5));
  else add('Popular', 'tg' + String(tot + 0.5).replace('.', ''), `Total goals · Over/Under ${tot + 0.5}`, ou(tot + 0.5));

  // Goals
  for (const l of lines) add('Goals', 'tg' + String(l).replace('.', ''), `Total goals · Over/Under ${l}`, ou(l));
  const th = (side, line) => { const o = sum(g, (c) => (side ? c.a : c.h) > line); return [{ label: `Over ${line}`, p: o }, { label: `Under ${line}`, p: 1 - o }]; };
  add('Goals', 'hg', `${H.name} total goals · Over/Under ${g0[0] + 0.5}`, th(0, g0[0] + 0.5));
  add('Goals', 'ag', `${A.name} total goals · Over/Under ${g0[1] + 0.5}`, th(1, g0[1] + 0.5));
  const ex = [0, 1, 2, 3, 4].map((k) => k + tot).map((k, i, arr) => ({ label: i === arr.length - 1 ? `${k}+ goals` : `${k} goal${k === 1 ? '' : 's'}`, p: i === arr.length - 1 ? sum(g, (c) => c.h + c.a >= k) : sum(g, (c) => c.h + c.a === k) }));
  add('Goals', 'eg', 'Exact total goals', ex, 5);

  // Halves
  if (info && info.min >= 45) {
    const g2 = grid(lh, la);
    const p2h = sum(g2, (c) => c.h > c.a), p2d = sum(g2, (c) => c.h === c.a);
    add('Halves', 'h2r', '2nd half result', [{ label: H.name, p: p2h }, { label: 'Draw', p: p2d }, { label: A.name, p: 1 - p2h - p2d }]);
    const o = sum(g2, (c) => c.h + c.a > 1.5);
    add('Halves', 'h2t', '2nd half total goals · Over/Under 1.5', [{ label: 'Over 1.5', p: o }, { label: 'Under 1.5', p: 1 - o }]);
    const fh = tot; // goals so far all came before half time in this sample
    const more = sum(g2, (c) => c.h + c.a > fh), eq = sum(g2, (c) => c.h + c.a === fh);
    add('Halves', 'hms', 'Highest scoring half', [{ label: '1st half', p: 1 - more - eq }, { label: 'Equal', p: eq }, { label: '2nd half', p: more }]);
    add('Halves', 'h1r', '1st half result', [{ label: H.name, p: 1 }, { label: 'Draw', p: 1 }, { label: A.name, p: 1 }], 3, { closed: `Settled at half time: ${g0[0]}–${g0[1]}` });
  } else {
    const gh = grid(lh * 0.45, la * 0.45, g0);
    const p1h = sum(gh, (c) => c.h > c.a), p1d = sum(gh, (c) => c.h === c.a);
    add('Halves', 'h1r', '1st half result', [{ label: H.name, p: p1h }, { label: 'Draw', p: p1d }, { label: A.name, p: 1 - p1h - p1d }]);
    const o = sum(gh, (c) => c.h + c.a > g0[0] + g0[1] + 0.5);
    add('Halves', 'h1t', `1st half total goals · Over/Under ${tot + 0.5}`, [{ label: `Over ${tot + 0.5}`, p: o }, { label: `Under ${tot + 0.5}`, p: 1 - o }]);
    const g2 = grid(lh * 0.55, la * 0.55);
    const p2h = sum(g2, (c) => c.h > c.a), p2d = sum(g2, (c) => c.h === c.a);
    add('Halves', 'h2r', '2nd half result', [{ label: H.name, p: p2h }, { label: 'Draw', p: p2d }, { label: A.name, p: 1 - p2h - p2d }]);
  }

  // Handicaps
  for (const l of [-1.5, -0.5, 0.5, 1.5]) {
    const cover = sum(g, (c) => c.h - c.a + l > 0);
    const s = (x) => (x > 0 ? `+${x}` : `${x}`);
    add('Handicaps', 'ah' + String(l).replace('.', '').replace('-', 'm'), `Asian handicap ${H.short} ${s(l)} / ${A.short} ${s(-l)}`, [{ label: `${H.name} ${s(l)}`, p: cover }, { label: `${A.name} ${s(-l)}`, p: 1 - cover }]);
  }
  const h1 = sum(g, (c) => c.h - 1 > c.a), d1 = sum(g, (c) => c.h - 1 === c.a);
  add('Handicaps', 'eh1', `Handicap 3-way · ${H.short} −1`, [{ label: `${H.short} −1`, p: h1 }, { label: 'Draw (−1)', p: d1 }, { label: `${A.short} +1`, p: 1 - h1 - d1 }]);

  // Goalscorers (invented names)
  const rows = [];
  for (const [side, t, lam] of [[0, H, lh], [1, A, la]]) {
    squad(t.id).forEach((name, i) => {
      const share = [0.32, 0.22, 0.15, 0.1, 0.07, 0.05][i];
      const any = 1 - Math.exp(-lam * share * 1.1);
      rows.push({ name, team: t.short, side, any, next: any * 0.55 });
    });
  }
  rows.sort((a, b) => b.any - a.any);
  add('Goalscorers', 'gs', info ? 'Goalscorers · next and anytime' : 'Goalscorers · first and anytime', rows.flatMap((x) => [
    { label: `${x.name} · ${info ? 'next' : 'first'}`, player: x.name, team: x.team, col: info ? 'Next' : 'First', p: x.next },
    { label: `${x.name} · anytime`, player: x.name, team: x.team, col: 'Anytime', p: x.any },
  ]), 2, { kind: 'players', margin: 1.25 });

  // Corners & cards
  const cm = 9.5 + Math.round(r() * 2);
  const cp = 0.46 + r() * 0.1;
  add('Corners & cards', 'tc', `Total corners · Over/Under ${cm}`, [{ label: `Over ${cm}`, p: cp }, { label: `Under ${cm}`, p: 1 - cp }]);
  const hc = 0.5 + ((H.str - A.str + 2) / 30) * 0.4;
  add('Corners & cards', 'cmb', 'Most corners', [{ label: H.name, p: hc * 0.88 }, { label: 'Tie', p: 0.12 }, { label: A.name, p: (1 - hc) * 0.88 }]);
  add('Corners & cards', 'nc', 'Next corner', [{ label: H.name, p: hc }, { label: A.name, p: 1 - hc }]);
  const kp = 0.5 + (r() - 0.5) * 0.12;
  add('Corners & cards', 'tk', 'Total cards · Over/Under 3.5', [{ label: 'Over 3.5', p: kp }, { label: 'Under 3.5', p: 1 - kp }]);
  add('Corners & cards', 'rc', 'Red card shown', [{ label: 'Yes', p: 0.12 }, { label: 'No', p: 0.88 }]);
  return M;
}

function otherMarkets(mt) {
  const H = TEAMS[mt.home], A = TEAMS[mt.away];
  let p = 1 / (1 + Math.exp(-(H.str - A.str + 2) / 6));
  const info = liveInfo(mt);
  if (info && info.score) p = Math.min(0.95, Math.max(0.05, p + (info.score[0] - info.score[1]) * (mt.sport === 'basketball' ? 0.02 : 0.12)));
  const M = [];
  const add = (group, id, name, outcomes, cols = outcomes.length) => M.push({ group, id, name, outcomes, cols });
  if (isThreeWay(mt)) {
    const d = 0.2;
    add('Popular', 'mr', 'Match result (regular time)', [{ label: H.name, short: H.nick, p: p * (1 - d) }, { label: 'Draw', p: d }, { label: A.name, short: A.nick, p: (1 - p) * (1 - d) }]);
    add('Totals', 'tg55', 'Total goals · Over/Under 5.5', [{ label: 'Over 5.5', p: 0.52 }, { label: 'Under 5.5', p: 0.48 }]);
    add('Popular', 'ml', 'Winner (incl. overtime)', [{ label: H.name, p }, { label: A.name, p: 1 - p }]);
  } else {
    add('Popular', 'mr', mt.sport === 'tennis' ? 'Match winner' : 'Winner', [{ label: H.name, short: H.nick, p }, { label: A.name, short: A.nick, p: 1 - p }]);
    if (mt.sport === 'tennis') {
      add('Popular', 'sw', 'Current set winner', [{ label: H.name, p: 0.58 }, { label: A.name, p: 0.42 }]);
      add('Totals', 'tgm', 'Total games · Over/Under 22.5', [{ label: 'Over 22.5', p: 0.55 }, { label: 'Under 22.5', p: 0.45 }]);
    } else if (mt.sport === 'basketball') {
      add('Totals', 'tp', 'Total points · Over/Under 214.5', [{ label: 'Over 214.5', p: 0.5 }, { label: 'Under 214.5', p: 0.5 }]);
      add('Popular', 'hc', `Handicap ${H.short} −4.5`, [{ label: `${H.short} −4.5`, p: p - 0.1 }, { label: `${A.short} +4.5`, p: 1.1 - p }]);
    } else {
      add('Popular', 'mw', 'Current map winner', [{ label: H.name, p: 0.6 }, { label: A.name, p: 0.4 }]);
      add('Totals', 'tm', 'Total maps · Over/Under 2.5', [{ label: 'Over 2.5', p: 0.47 }, { label: 'Under 2.5', p: 0.53 }]);
    }
  }
  return M;
}

// synthetic recent price history so traces have shape on first load (sample data)
function seedHist(selId, end) {
  const r = rng('h' + selId);
  const out = [end];
  let v = end;
  for (let i = 0; i < 23; i++) { v = round(v * (1 + (r() - 0.5) * 0.06)); out.unshift(v); }
  return out;
}
export const hist = (selId) => { odds(selId); return ODDS.get(selId)?.hist || []; };
const CACHE = new Map();
export function markets(matchId) {
  if (CACHE.has(matchId)) return CACHE.get(matchId);
  const mt = match(matchId);
  const list = (mt.sport === 'football' ? footballMarkets(mt) : otherMarkets(mt)).map((mk) => ({
    ...mk,
    matchId,
    outcomes: mk.outcomes.map((o, i) => {
      const selId = `${matchId}|${mk.id}|${i}`;
      const fair = price(o.p, mk.margin);
      if (!ODDS.has(selId)) ODDS.set(selId, { v: fair, dir: null, ts: 0, hist: seedHist(selId, fair) });
      return { ...o, selId, fair };
    }),
  }));
  CACHE.set(matchId, list);
  return list;
}
export const groupsOf = (matchId) => [...new Set(markets(matchId).map((m) => m.group))];
export const market = (matchId, marketId) => markets(matchId).find((m) => m.id === marketId);
export const mainMarket = (matchId) => market(matchId, 'mr');
export function selection(selId) {
  const [matchId, marketId, idx] = selId.split('|');
  const mk = market(matchId, marketId);
  if (!mk) return null;
  return { match: match(matchId), market: mk, outcome: mk.outcomes[+idx] };
}
export const odds = (selId) => { if (!ODDS.has(selId)) selection(selId); return ODDS.get(selId)?.v ?? null; };
export function isSuspended(selId) {
  const [matchId, marketId] = selId.split('|');
  return SUSP_MATCH.has(matchId) || SUSP.has(`${matchId}|${marketId}`) || !!market(matchId, marketId)?.closed;
}
export const marketSuspended = (matchId, marketId) => SUSP_MATCH.has(matchId) || SUSP.has(`${matchId}|${marketId}`);
export const marketsOpen = (matchId) => markets(matchId).length; 

export function setOdds(selId, v) {
  const cur = ODDS.get(selId);
  if (!cur) return;
  v = round(v);
  if (v === cur.v) v = round(cur.v * (Math.random() < 0.5 ? 1.06 : 0.94));
  if (v === cur.v) return;
  const hist = [...(cur.hist || []), v].slice(-40);
  ODDS.set(selId, { v, dir: v > cur.v ? 'up' : 'down', ts: Date.now(), from: cur.v, hist });
  emit({ type: 'odds', selId });
}
export function suspendMarket(matchId, marketId, on) {
  const k = `${matchId}|${marketId}`;
  if (on) SUSP.add(k); else SUSP.delete(k);
  emit({ type: 'susp', matchId, marketId });
}
export function suspendMatch(matchId, reason) {
  if (reason) SUSP_MATCH.set(matchId, reason); else SUSP_MATCH.delete(matchId);
  emit({ type: 'susp', matchId });
}

// ---------- live engine: odds drift + short random suspensions ----------
let timer;
export function startEngine() {
  clearInterval(timer);
  let tick = 0;
  timer = setInterval(() => {
    if (paused) return;
    tick++;
    const live = MATCHES.filter((x) => x.live);
    // ARS v BHA moves most (it's the showcase match)
    const pool = [];
    for (const mt of live) {
      const mks = markets(mt.id);
      const n = mt.id === 'ars-bha' ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const mk = mks[Math.floor(Math.random() * Math.min(mks.length, mt.id === 'ars-bha' ? mks.length : 3))];
        if (mk.closed || marketSuspended(mt.id, mk.id)) continue;
        const o = mk.outcomes[Math.floor(Math.random() * mk.outcomes.length)];
        pool.push(o.selId);
      }
    }
    for (const selId of pool) {
      if (Math.random() < 0.45) {
        const v = ODDS.get(selId).v;
        setOdds(selId, v * (1 + (Math.random() - 0.5) * 0.12));
      }
    }
    // every ~20s briefly suspend one ARS v BHA market (realistic "danger" moments)
    if (tick % 9 === 0) {
      const mks = markets('ars-bha').filter((m) => !m.closed && m.id !== 'mr');
      const mk = mks[Math.floor(Math.random() * mks.length)];
      suspendMarket('ars-bha', mk.id, true);
      setTimeout(() => {
        suspendMarket('ars-bha', mk.id, false);
        mk.outcomes.forEach((o) => setOdds(o.selId, ODDS.get(o.selId).v * (1 + (Math.random() - 0.5) * 0.1)));
      }, 5000);
    }
  }, 2200);
}

// Re-price a match after a score change (demo goal): suspend, update score, reopen with new prices.
export function goal(matchId, side) {
  const mt = match(matchId);
  if (!mt?.live || !mt.score) return;
  suspendMatch(matchId, 'Goal confirmed. Markets reopen in a few seconds.');
  mt.score = side ? [mt.score[0], mt.score[1] + 1] : [mt.score[0] + 1, mt.score[1]];
  emit({ type: 'score', matchId });
  setTimeout(() => {
    CACHE.delete(matchId);
    const list = markets(matchId);
    list.forEach((mk) => mk.outcomes.forEach((o) => { if (ODDS.get(o.selId).v !== o.fair) setOdds(o.selId, o.fair); }));
    suspendMatch(matchId, null);
    emit({ type: 'reprice', matchId });
  }, 4000);
}
