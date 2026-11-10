import { SEED_BETS, match, TEAMS } from './data.js';
import { odds, selection, isSuspended, ODDS, hist } from './markets.js';

const KEY = 'hb-sportsbook-v2';
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();

export const state = {
  balance: saved.balance ?? 250,
  slip: saved.slip ?? [], // { selId, accepted, stake }
  bets: saved.bets ?? SEED_BETS.map((b) => ({ ...b })),
  follows: saved.follows ?? { teams: ['ars'], comps: ['epl'] },
  slipStatus: null, // null | 'placing' | { ok:true, ids:[] } | { ok:false, msg }
  panelTab: 'slip', // 'slip' | 'bets'
  betsTab: 'open',
  demo: { nothingLive: false, failNext: false, signedOut: false, paused: false },
  cashing: null, // bet id awaiting confirm
  activeStake: null, // selId the keypad types into
  collapsed: new Set(), // collapsed market ids on the match page
  mq: '', // market search on the match page
};

const subs = new Set();
export const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
export function commit(what = 'all') {
  try {
    localStorage.setItem(KEY, JSON.stringify({ balance: state.balance, slip: state.slip, bets: state.bets, follows: state.follows }));
  } catch { /* storage full or blocked: prototype keeps working in memory */ }
  subs.forEach((fn) => fn(what));
}
export function resetAll() {
  localStorage.removeItem(KEY);
  location.hash = '#/';
  location.reload();
}

// ---------- follows ----------
export const isFollowing = (kind, id) => state.follows[kind].includes(id);
export function toggleFollow(kind, id) {
  const list = state.follows[kind];
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1); else list.push(id);
  commit('follows');
  return i < 0;
}

// ---------- slip ----------
export const inSlip = (selId) => state.slip.some((s) => s.selId === selId);
export function toggleSelection(selId) {
  if (isSuspended(selId) && !inSlip(selId)) return 'suspended';
  const i = state.slip.findIndex((s) => s.selId === selId);
  if (i >= 0) state.slip.splice(i, 1);
  else {
    const sel = selection(selId);
    const mt = sel.match;
    state.slip.push({ selId, accepted: odds(selId), stake: '', label: sel.outcome.label, marketName: sel.market.name, event: `${TEAMS[mt.home].nick} v ${TEAMS[mt.away].nick}`, matchId: mt.id });
    state.activeStake = selId;
  }
  if (state.slipStatus && state.slipStatus !== 'placing') state.slipStatus = null;
  commit('slip');
  return i >= 0 ? 'removed' : 'added';
}
export function removeSelection(selId) {
  state.slip = state.slip.filter((s) => s.selId !== selId);
  commit('slip');
}
export function clearSlip() { state.slip = []; state.slipStatus = null; commit('slip'); }
export function setStake(selId, v) {
  const s = state.slip.find((x) => x.selId === selId);
  if (s) s.stake = v;
  try { localStorage.setItem(KEY, JSON.stringify({ balance: state.balance, slip: state.slip, bets: state.bets, follows: state.follows })); } catch {}
}
export const gone = (s) => !selection(s.selId);
export const changed = (s) => !gone(s) && odds(s.selId) !== s.accepted;
export function acceptChanges() {
  state.slip.forEach((s) => (s.accepted = odds(s.selId)));
  commit('slip');
}
export const MIN_STAKE = 0.1;
export const MAX_STAKE = 1000;
export const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
export function slipSummary() {
  let stake = 0, ret = 0, ready = 0;
  const issues = { changed: 0, suspended: 0, noStake: 0, tooLow: 0, tooHigh: 0 };
  for (const s of state.slip) {
    const n = num(s.stake);
    const susp = gone(s) || isSuspended(s.selId);
    if (susp) issues.suspended++;
    else if (changed(s)) issues.changed++;
    if (!n) issues.noStake++;
    else if (n < MIN_STAKE) issues.tooLow++;
    else if (n > MAX_STAKE) issues.tooHigh++;
    if (n && !susp) { stake += n; ret += n * odds(s.selId); ready++; }
  }
  return { stake, ret, ready, issues, overBalance: stake > state.balance };
}

let seq = 48230;
export function placeBets() {
  if (state.slipStatus === 'placing') return; // no double submit
  state.slipStatus = 'placing';
  commit('slip');
  const fail = state.demo.failNext;
  setTimeout(() => {
    if (fail) {
      state.demo.failNext = false;
      state.slipStatus = { ok: false, msg: 'Bets not placed. The trading service did not confirm in time. No USDT was taken from your balance.' };
      commit('all');
      return;
    }
    const placed = [];
    for (const s of state.slip) {
      const n = num(s.stake);
      if (!n || gone(s) || isSuspended(s.selId)) continue;
      const sel = selection(s.selId);
      const mt = sel.match;
      const id = `HB-${++seq}`;
      placed.push({ id, stake: n, odds: odds(s.selId), pick: sel.outcome.label, event: `${TEAMS[mt.home].name} v ${TEAMS[mt.away].name}` });
      state.bets.unshift({ id, matchId: mt.id, selId: s.selId, market: sel.market.name, pick: sel.outcome.label, odds: odds(s.selId), stake: n, placed: Date.now(), status: 'open' });
      state.balance = Math.round((state.balance - n) * 100) / 100;
    }
    state.slip = state.slip.filter((s) => !num(s.stake) || gone(s) || isSuspended(s.selId));
    state.slipStatus = { ok: true, placed };
    commit('all');
  }, 1100);
}
export function dismissStatus() { state.slipStatus = null; commit('slip'); }

// ---------- my bets ----------
export function cashOutValue(b) {
  if (!b.selId || b.status !== 'open' || !selection(b.selId)) return null;
  const now = odds(b.selId);
  if (!now) return null;
  return Math.max(0.1, Math.round(((b.stake * b.odds) / now) * 0.95 * 100) / 100);
}
export function cashOut(id) {
  const b = state.bets.find((x) => x.id === id);
  if (!b || b.status !== 'open' || isSuspended(b.selId)) return false;
  const v = cashOutValue(b);
  if (v == null) return false;
  b.status = 'cashed';
  b.ret = v;
  b.settledAt = Date.now();
  state.balance = Math.round((state.balance + v) * 100) / 100;
  state.cashing = null;
  commit('all');
  return v;
}
export const eventName = (b) => (b.matchId ? `${TEAMS[match(b.matchId).home].name} v ${TEAMS[match(b.matchId).away].name}` : b.event);

export function cashOutTrend(b) {
  if (!b.selId || !selection(b.selId)) return [];
  return hist(b.selId).slice(-24).map((h) => Math.round(((b.stake * b.odds) / h) * 0.95 * 100) / 100);
}
// stake keypad: types into the active selection (or the first one)
export function keypad(key) {
  const s = state.slip.find((x) => x.selId === state.activeStake) || state.slip[0];
  if (!s) return null;
  state.activeStake = s.selId;
  let v = String(s.stake || '');
  if (key === 'del') v = v.slice(0, -1);
  else if (key === 'clr') v = '';
  else if (key === '.') { if (!v.includes('.')) v = (v || '0') + '.'; }
  else if (key === 'max') v = String(Math.min(MAX_STAKE, Math.floor(state.balance * 100) / 100));
  else if (key.startsWith('+')) v = String(Math.round((num(v) + +key.slice(1)) * 100) / 100);
  else { if (v.includes('.') && v.split('.')[1].length >= 2) return s.selId; if (v.replace('.', '').length >= 7) return s.selId; v = v === '0' ? key : v + key; }
  setStake(s.selId, v);
  return s.selId;
}
