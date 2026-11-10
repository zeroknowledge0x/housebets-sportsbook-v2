import '@fontsource/saira-condensed/500.css';
import '@fontsource/saira-condensed/600.css';
import '@fontsource/saira-condensed/700.css';
import '@fontsource-variable/schibsted-grotesk';
import './styles.css';
import { MATCHES, TEAMS, COMPS, comp, match, squad, sport } from './data.js';
import { startEngine, onOdds, markets, selection, setOdds, odds as oddsOf, hist, suspendMarket, suspendMatch, SUSP_MATCH, SUSP, setPaused, goal, isSuspended, mainMarket } from './markets.js';
import { state, subscribe, toggleSelection, removeSelection, clearSlip, setStake, acceptChanges, placeBets, dismissStatus, toggleFollow, inSlip, cashOut, resetAll, num, keypad } from './store.js';
import * as V from './views.js';
import { icon, logo, starFilled } from './icons.js';
import { esc, usdt, fOdds, parseHash } from './util.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mqDesk = matchMedia('(min-width: 1200px)');
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- shell ----------
document.querySelector('#app').innerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <header class="top">
    <a class="top__logo" href="#/" aria-label="Housebets sports home">${logo()}</a>
    <div class="top__search">${V.searchBox('q-top')}</div>
    <div class="top__r" data-top-r></div>
  </header>
  <div class="tick" data-ticker role="region" aria-label="Live scores"></div>
  <aside class="nav" aria-label="Main" data-nav-side></aside>
  <main id="main" class="main" tabindex="-1"></main>
  <aside class="side" aria-label="Bet slip and my bets" data-side></aside>
  <div class="mbar" data-mbar></div>
  <nav class="bnav" aria-label="Mobile">
    <button type="button" class="bnav__i" data-open="menu">${icon('menu')}<span>Menu</span></button>
    <a class="bnav__i" href="#/" data-bn="sports">${icon('football')}<span>Sports</span></a>
    <a class="bnav__i" href="#casino">${icon('casino')}<span>Casino</span></a>
    <a class="bnav__i" href="#chat">${icon('chat')}<span>Chat</span></a>
    <button type="button" class="bnav__i" data-open="search">${icon('search')}<span>Search</span></button>
  </nav>
  <dialog class="dlg dlg--menu" id="dlg-menu" aria-label="Menu"></dialog>
  <dialog class="dlg dlg--search" id="dlg-search" aria-label="Search">
    <div class="dlg__h"><h2>Search</h2><button type="button" class="x" data-close aria-label="Close search">${icon('x')}</button></div>
    <div class="dlg__b">${V.searchBox('q-ov')}</div>
  </dialog>
  <dialog class="dlg dlg--demo" id="dlg-demo" aria-labelledby="demo-h"></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

function renderTop() {
  $('[data-top-r]').innerHTML = `
    <button type="button" class="demo" data-open="demo" aria-haspopup="dialog">${icon('sliders', 'ic--sm')}<span>Demo states</span></button>
    ${state.demo.signedOut
      ? `<button type="button" class="btn btn--line btn--sm" data-act="login">Log in</button><button type="button" class="btn btn--sm" data-act="login">Register</button>`
      : `<a class="wal" href="#wallet" aria-label="Wallet, demo balance ${state.balance.toFixed(2)} USDT"><span class="wal__c" aria-hidden="true">₮</span><b>${state.balance.toFixed(2)}</b><small>USDT</small><span class="wal__b" aria-hidden="true">${icon('wallet', 'ic--sm')}</span></a>`}`;
}
function navItems(active) {
  return `${V.sportsNav(active, 'snav--side')}
    <hr />
    <a class="snav__i${active === 'betslip' ? ' is-on' : ''}" href="#/betslip">${icon('ticket', 'ic--sm')}<span>Bet slip &amp; My bets</span>${state.slip.length ? `<b>${state.slip.length}</b>` : ''}</a>
    <a class="snav__i" href="#casino">${icon('casino', 'ic--sm')}<span>Casino</span></a>`;
}
function renderNav(active) {
  $('[data-nav-side]').innerHTML = `${navItems(active)}<p class="nav__foot">Sample data. Demo USDT, no real money.</p>`;
}
function renderMenu() {
  $('#dlg-menu').innerHTML = `<div class="dlg__h">${logo(true)}<button type="button" class="x" data-close aria-label="Close menu">${icon('x')}</button></div>
    <div class="dlg__b">${navItems(route.name === 'match' ? match(route.id)?.sport : route.name)}<button type="button" class="btn btn--line btn--block" data-open="demo">${icon('sliders', 'ic--sm')} Demo states</button></div>`;
}
function renderTicker() { $('[data-ticker]').innerHTML = V.ticker(); }
function renderDemo() {
  const d = state.demo;
  const slipN = state.slip.length;
  const tg = (k, label, hint) => `<label class="tg"><input type="checkbox" data-demo="${k}" ${d[k] ? 'checked' : ''} /><span class="tg__sw" aria-hidden="true"></span><span><b>${label}</b><small>${hint}</small></span></label>`;
  const slipSusp = state.slip.some((s) => SUSP.has(s.selId.split('|').slice(0, 2).join('|')));
  $('#dlg-demo').innerHTML = `<div class="dlg__h"><h2 id="demo-h">${icon('sliders', 'ic--sm')} Demo states</h2><button type="button" class="x" data-close aria-label="Close demo states">${icon('x')}</button></div>
    <div class="dlg__b demo-p">
      <p class="hint">Trigger every state on demand. Sample data, demo USDT.</p>
      ${tg('nothingLive', 'Nothing live', 'Live, ticker and home switch to Starting soon')}
      ${tg('failNext', 'Next bet fails', 'Place once to see the failed state')}
      ${tg('signedOut', 'Signed out', 'Shell shows Log in and Register')}
      ${tg('paused', 'Pause live updates', 'Freezes clocks and price moves')}
      <div class="demo-p__g">
        <button type="button" class="btn btn--line btn--sm" data-demo-act="odds" ${slipN ? '' : 'disabled'}>Move prices in slip</button>
        <button type="button" class="btn btn--line btn--sm" data-demo-act="suspend-sel" ${slipN ? '' : 'disabled'}>${slipSusp ? 'Reopen slip pick' : 'Suspend a slip pick'}</button>
        <button type="button" class="btn btn--line btn--sm" data-demo-act="suspend-match">${SUSP_MATCH.has('ars-bha') ? 'Reopen' : 'Suspend'} Arsenal v Brighton</button>
        <button type="button" class="btn btn--line btn--sm" data-demo-act="goal">Goal for Brighton</button>
      </div>
      ${slipN ? '' : '<p class="hint">Add a price to the slip to unlock the slip states.</p>'}
      <button type="button" class="lnk" data-demo-act="reset">${icon('refresh', 'ic--xs')} Reset prototype</button>
    </div>`;
}

// ---------- routing ----------
let route = { name: 'home' };
let navigated = false;
function currentRoute() {
  const { parts, q } = parseHash();
  const [a, b] = parts;
  if (!a) return { name: 'home', q };
  if (a === 'live') return { name: 'live', q };
  if (a === 'football') return { name: 'football', q };
  if (a === 'sport' && sport(b)) return { name: b === 'football' ? 'football' : b, q };
  if (a === 'match') return { name: 'match', id: b, q };
  if (a === 'betslip') return { name: 'betslip', q };
  return null;
}
function renderMain({ keepScroll = false, keepFocus = false } = {}) {
  const r = currentRoute();
  if (!r) return;
  const sameView = r.name === route.name && r.id === route.id;
  route = r;
  const main = $('#main');
  const y = scrollY;
  const f = keepFocus && captureFocus(main);
  const openDetails = sameView ? $$('details[open][id]', main).map((d) => d.id) : [];
  let html, t;
  switch (r.name) {
    case 'home': html = V.pageHome(); t = 'Sports home'; break;
    case 'live': html = V.pageLive(r.q); t = 'Live'; break;
    case 'football': html = V.pageSport('football', r.q); t = 'Football'; break;
    case 'match': { const mt = match(r.id); if (!sameView) { state.mq = ''; } html = V.pageMatch(r.id, r.q); t = mt ? V.title(mt) : 'Match'; break; }
    case 'betslip': html = V.betslipPage(); t = 'Bet slip & My bets'; break;
    default: html = V.pageSport(r.name, r.q); t = sport(r.name).name;
  }
  main.innerHTML = html;
  openDetails.forEach((id) => { const d = document.getElementById(id); if (d) d.open = true; });
  document.title = `${t} · Housebets Sportsbook v2 (prototype)`;
  document.body.dataset.route = r.name;
  const navId = r.name === 'match' ? match(r.id)?.sport : r.name;
  renderNav(navId);
  $$('[data-bn]').forEach((el) => el.classList.toggle('is-on', r.name !== 'betslip'));
  wireSearch(main);
  const league = r.q.get('league');
  if (league && document.getElementById(league)) {
    const el = document.getElementById(league);
    requestAnimationFrame(() => el.scrollIntoView({ behavior: sameView && !reduce() ? 'smooth' : 'auto', block: 'start' }));
  } else if (keepScroll || sameView) scrollTo(0, y);
  else scrollTo(0, 0);
  if (f) restoreFocus(main, f);
  else if (!sameView && !keepScroll && navigated) $('h1', main)?.focus({ preventScroll: true });
}
function renderSlips({ keepFocus = true } = {}) {
  const side = $('[data-side]');
  const fs = keepFocus && captureFocus(side);
  side.innerHTML = V.slipPanel();
  if (fs) restoreFocus(side, fs);
  if (route.name === 'betslip') renderMain({ keepScroll: true, keepFocus: true });
  renderBar();
  renderTop();
  const n = $('[data-nav-side]'); if (n) renderNav(route.name === 'match' ? match(route.id)?.sport : route.name);
}
function renderBar() {
  const n = state.slip.length;
  const sm = (() => { let st = 0, rt = 0, ready = 0, warn = 0; for (const s of state.slip) { const v = num(s.stake); const su = !selection(s.selId) || isSuspended(s.selId); if (su || (selection(s.selId) && oddsOf(s.selId) !== s.accepted)) warn++; if (v && !su) { st += v; rt += v * oddsOf(s.selId); ready++; } } return { st, rt, ready, warn }; })();
  const bar = $('[data-mbar]');
  bar.hidden = route.name === 'betslip';
  const openN = state.bets.filter((b) => b.status === 'open').length;
  bar.innerHTML = n
    ? `<a class="mbar__a${sm.warn ? ' is-warn' : ''}" href="#/betslip" aria-label="Open bet slip, ${n} pick${n === 1 ? '' : 's'}"><span class="mbar__n">${n}</span><span class="mbar__t"><b>Bet slip</b><small>${sm.warn ? 'Check your picks' : sm.ready ? `Returns ${usdt(sm.rt)}` : 'Tap to enter a stake'}</small></span><span class="mbar__go">${sm.ready ? usdt(sm.st) : 'Stake'} ${icon('chevUp', 'ic--sm')}</span></a>`
    : `<a class="mbar__a mbar__a--e" href="#/betslip" aria-label="Open bet slip and my bets">${icon('ticket', 'ic--sm')}<span class="mbar__t"><b>Bet slip</b><small>Tap a price to add a single</small></span><span class="mbar__go">My bets ${openN} ${icon('chevUp', 'ic--sm')}</span></a>`;
}
function captureFocus(root) {
  const a = document.activeElement;
  if (!a || !root.contains(a)) return null;
  for (const attr of ['data-stake', 'data-mq', 'data-ptab', 'data-btab', 'data-act', 'data-cash', 'data-cash-yes', 'data-cash-no', 'data-sel', 'data-follow', 'data-remove', 'data-key', 'data-toggle-mk', 'data-collapse-all']) {
    if (a.hasAttribute(attr)) return { sel: `[${attr}="${CSS.escape(a.getAttribute(attr))}"]`, s: a.selectionStart, e: a.selectionEnd };
  }
  return null;
}
function restoreFocus(root, f) {
  const el = $$(f.sel, root).find((x) => x.offsetParent !== null) || $(f.sel, root);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (f.s != null && el.setSelectionRange) try { el.setSelectionRange(f.s, f.e); } catch {}
}
function patchSlip() {
  for (const s of state.slip) {
    const k = CSS.escape(s.selId);
    $$(`[data-slip-odds="${k}"]`).forEach((el) => (el.innerHTML = V.slipOdds(s)));
    $$(`[data-slip-msg="${k}"]`).forEach((el) => (el.innerHTML = V.slipMsg(s)));
    $$(`[data-ret="${k}"]`).forEach((el) => (el.innerHTML = V.retText(s)));
    $$(`[data-stake-err="${k}"]`).forEach((el) => (el.textContent = V.stakeErr(s)));
    $$(`[data-stake="${k}"]`).forEach((el) => { if (el !== document.activeElement && el.value !== s.stake) el.value = s.stake; });
  }
  $$('[data-slip-foot]').forEach((el) => { const f = captureFocus(el); el.innerHTML = V.slipFoot(); if (f) restoreFocus(el, f); });
  renderBar();
}
function setActive(selId) {
  if (state.activeStake === selId) return;
  state.activeStake = selId;
  const s = state.slip.find((x) => x.selId === selId);
  $$('.si').forEach((li) => li.classList.toggle('is-act', li.dataset.slip === selId));
  $$('.stake').forEach((l) => l.classList.toggle('is-act', l.querySelector('input')?.dataset.stake === selId));
  $$('[data-keypad]').forEach((k) => (k.innerHTML = V.keypadUI(s)));
}
function patchCashouts() {
  for (const b of state.bets) if (b.status === 'open') $$(`[data-co="${b.id}"]`).forEach((el) => { const f = captureFocus(el); el.innerHTML = V.cashOutUI(b); if (f) restoreFocus(el, f); });
}
function patchTraces(selId) {
  $$(`[data-trace="${CSS.escape(selId)}"]`).forEach((el) => {
    const h = hist(selId);
    el.innerHTML = `${V.spark(h, { w: 240, h: 40, area: true, cls: 'spark--hero' })}<b class="${h[h.length - 1] <= h[0] ? 'pos' : 'neg'}">${fOdds(h[0])} → ${fOdds(h[h.length - 1])}</b>`;
  });
}

// ---------- toast ----------
let toastT;
function toast(html, kind = '') {
  const t = $('#toast');
  t.className = `toast is-on ${kind}`;
  const i = html.indexOf('</svg>');
  t.innerHTML = i > 0 ? `${html.slice(0, i + 6)}<span>${html.slice(i + 6).trim()}</span>` : `<span>${html}</span>`;
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
}

// ---------- search (teams, players, competitions, markets) ----------
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const INDEX = (() => {
  const out = [];
  const firstMatchOf = (tid) => MATCHES.filter((m) => m.home === tid || m.away === tid).sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0))[0];
  for (const t of Object.values(TEAMS)) {
    const m = firstMatchOf(t.id);
    if (!m) continue;
    const isPlayer = t.pattern === 'player';
    out.push({ type: isPlayer ? 'Players' : 'Teams', title: t.name, sub: `${m.live ? 'Live now · ' : ''}${V.title(m)}`, href: m.sport === 'football' && !m.live ? `#/football?team=${t.id}` : `#/match/${m.id}` });
  }
  const done = new Set();
  for (const m of MATCHES.filter((x) => x.sport === 'football')) for (const tid of [m.home, m.away]) {
    if (done.has(tid)) continue; done.add(tid);
    squad(tid).forEach((n) => out.push({ type: 'Players', title: n, sub: `${TEAMS[tid].name} · goalscorer markets`, href: `#/match/${m.id}?g=Goalscorers` }));
  }
  for (const c of COMPS) out.push({ type: 'Competitions', title: c.name, sub: `${sport(c.sport).name} · ${c.region}`, href: c.sport === 'football' ? (V.FOOTBALL_COMPS.includes(c.id) ? `#/football?league=${c.id}` : `#/live?sport=football&comp=${c.id}`) : `#/sport/${c.sport}` });
  for (const mk of markets('ars-bha')) out.push({ type: 'Markets', title: mk.name, sub: `Arsenal v Brighton & Hove Albion · ${mk.group}`, href: `#/match/ars-bha?g=${encodeURIComponent(mk.group)}` });
  out.forEach((o) => (o.key = norm(`${o.title} ${o.sub}`)));
  return out;
})();
function searchResults(q) {
  const toks = norm(q).trim().split(/\s+/).filter(Boolean);
  if (!toks.length) return null;
  const hits = INDEX.filter((o) => toks.every((t) => o.key.includes(t))).map((o) => {
    const tt = norm(o.title); const inTitle = toks.every((t) => tt.includes(t));
    return { o, inTitle, s: (tt.startsWith(toks[0]) ? 0 : 1) + (inTitle ? 0 : 2) };
  }).filter((h) => h.inTitle || h.o.type !== 'Players').sort((a, b) => a.s - b.s);
  return ['Teams', 'Players', 'Competitions', 'Markets'].map((g) => [g, hits.filter((h) => h.o.type === g).slice(0, 4).map((h) => h.o)]).filter(([, l]) => l.length);
}
const hl = (text, q) => {
  const tok = norm(q).trim().split(/\s+/)[0]; const i = tok ? norm(text).indexOf(tok) : -1;
  return i < 0 ? esc(text) : `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + tok.length))}</mark>${esc(text.slice(i + tok.length))}`;
};
function wireSearch(root) {
  $$('[data-search]', root).forEach((box) => {
    if (box.dataset.wired) return;
    box.dataset.wired = '1';
    const input = $('input', box), pop = $('.search__pop', box);
    let active = -1;
    const items = () => $$('[role="option"]', pop);
    const close = () => { pop.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
    const draw = () => {
      const q = input.value; const res = searchResults(q); let html;
      if (!res) {
        const sug = [['Teams', 'Arsenal', '#/match/ars-bha'], ['Players', squad('bha')[0], '#/match/ars-bha?g=Goalscorers'], ['Competitions', 'Champions League', '#/football?league=ucl'], ['Markets', 'Total corners', '#/match/ars-bha?g=Corners%20%26%20cards']];
        html = `<p class="search__g">Try</p><div class="search__sug">${sug.map(([g, t, h], i) => `<a role="option" id="${input.id}-o${i}" class="search__o search__o--chip" href="${h}"><small>${g}</small>${esc(t)}</a>`).join('')}</div>`;
      } else if (!res.length) html = `<div class="search__none"><b>No results for “${esc(q)}”</b><p>Search a team, a player, a competition or a market such as “corners”.</p></div>`;
      else { let i = 0; html = res.map(([g, l]) => `<p class="search__g">${g}</p>${l.map((o) => `<a role="option" id="${input.id}-o${i++}" class="search__o" href="${o.href}"><span>${hl(o.title, q)}</span><small>${esc(o.sub)}</small></a>`).join('')}`).join(''); }
      pop.innerHTML = html; pop.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    };
    input.addEventListener('input', draw);
    input.addEventListener('focus', draw);
    input.addEventListener('keydown', (e) => {
      const it = items();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (pop.hidden) draw();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length;
        it.forEach((x, j) => x.classList.toggle('is-act', j === active));
        if (it[active]) { input.setAttribute('aria-activedescendant', it[active].id); it[active].scrollIntoView({ block: 'nearest' }); }
      } else if (e.key === 'Enter' && it[active >= 0 ? active : 0]) { e.preventDefault(); navigated = true; location.hash = it[active >= 0 ? active : 0].getAttribute('href'); close(); input.blur(); }
      else if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); e.preventDefault(); close(); }
    });
    box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget)) setTimeout(close, 120); });
    pop.addEventListener('click', () => { close(); navigated = true; $('#dlg-search').open && $('#dlg-search').close(); });
  });
}
wireSearch(document.querySelector('.top'));

// ---------- dialogs ----------
function openDlg(name) {
  if (name === 'menu') { renderMenu(); $('#dlg-menu').showModal(); }
  if (name === 'search') {
    const top = $('#q-top');
    if (top && top.offsetParent) { top.focus(); return; }
    const d = $('#dlg-search'); wireSearch(d); d.showModal(); $('input', d).focus();
  }
  if (name === 'demo') { $$('dialog[open]').forEach((d) => d.close()); renderDemo(); $('#dlg-demo').showModal(); }
}
$$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

// ---------- events ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, a, input, summary');
  if (!t) return;
  const ds = t.dataset;
  if (ds.sel) {
    e.preventDefault();
    if (t.getAttribute('aria-disabled') === 'true') { toast(`${icon('lock', 'ic--sm')} Suspended. Betting is paused on this market; it usually reopens in seconds.`, 'is-warn'); return; }
    const res = toggleSelection(ds.sel);
    $$(`[data-sel="${CSS.escape(ds.sel)}"]`).forEach(V.patchOdd);
    if (res === 'added') {
      const sel = selection(ds.sel);
      state.panelTab = 'slip';
      toast(`${icon('check', 'ic--sm')} ${esc(sel.outcome.label)} at ${fOdds(oddsOf(ds.sel))} added to your slip`);
      const b = $('[data-mbar]'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    }
    renderSlips({ keepFocus: false });
    return;
  }
  if (ds.follow) {
    e.preventDefault();
    const [k, id] = ds.follow.split(':');
    const name = k === 'teams' ? TEAMS[id].name : comp(id).name;
    const on = toggleFollow(k, id);
    toast(on ? `${starFilled('ic--sm')} Following ${esc(name)}. Pinned to Favourites on Sports home.` : `${icon('star', 'ic--sm')} Unfollowed ${esc(name)}.`);
    renderMain({ keepScroll: true, keepFocus: true });
    return;
  }
  if (ds.key) {
    const id = keypad(ds.key);
    if (id) { patchSlip(); $$(`[data-stake="${CSS.escape(id)}"]`).forEach((i) => (i.value = state.slip.find((s) => s.selId === id).stake)); }
    return;
  }
  if (ds.toggleMk) {
    const id = ds.toggleMk;
    if (state.collapsed.has(id)) state.collapsed.delete(id); else state.collapsed.add(id);
    const sec = t.closest('.mk');
    const open = !state.collapsed.has(id);
    sec.classList.toggle('is-col', !open); t.setAttribute('aria-expanded', open); sec.querySelector('.mk__b').hidden = !open;
    return;
  }
  if (ds.collapseAll) {
    const ids = markets(ds.collapseAll).map((m) => m.id);
    if (state.collapsed.size) state.collapsed.clear(); else ids.forEach((i) => state.collapsed.add(i));
    renderMain({ keepScroll: true, keepFocus: true });
    return;
  }
  if (ds.ptab) { state.panelTab = ds.ptab; renderSlips(); return; }
  if (ds.btab) { state.betsTab = ds.btab; renderSlips(); return; }
  if (ds.remove) { removeSelection(ds.remove); $$(`[data-sel="${CSS.escape(ds.remove)}"]`).forEach(V.patchOdd); renderSlips({ keepFocus: false }); return; }
  if (ds.cash) { state.cashing = ds.cash; patchCashouts(); $(`[data-co="${ds.cash}"] [data-cash-yes]`)?.focus(); return; }
  if (ds.cashNo) { state.cashing = null; patchCashouts(); return; }
  if (ds.cashYes) {
    const v = cashOut(ds.cashYes);
    if (v === false) toast(`${icon('lock', 'ic--sm')} Cash out is suspended right now. Try again in a moment.`, 'is-warn');
    else { toast(`${icon('check', 'ic--sm')} Cashed out ${usdt(v)}. It’s in your balance.`); state.betsTab = 'settled'; renderSlips({ keepFocus: false }); }
    return;
  }
  if (ds.open) { e.preventDefault(); openDlg(ds.open); return; }
  if ('close' in ds) { t.closest('dialog').close(); return; }
  if (ds.demoAct) { demoAct(ds.demoAct); return; }
  if (ds.act) {
    const a = ds.act;
    if (a === 'place') placeBets();
    if (a === 'accept') { acceptChanges(); toast(`${icon('check', 'ic--sm')} New prices accepted. Check returns, then place.`); }
    if (a === 'dismiss') dismissStatus();
    if (a === 'view-bets') { dismissStatus(); state.panelTab = 'bets'; state.betsTab = 'open'; renderSlips({ keepFocus: false }); }
    if (a === 'login') toast(`${icon('user', 'ic--sm')} Log in is outside this prototype. Turn off “Signed out” in Demo states to keep betting.`);
    if (a === 'sample') {
      for (const [id, st] of [['ars-bha|mr|0', '10'], ['liv-mun|mr|1', '5']]) { if (!inSlip(id)) toggleSelection(id); setStake(id, st); }
      $$('[data-sel]').forEach(V.patchOdd); renderSlips({ keepFocus: false });
      toast(`${icon('check', 'ic--sm')} Added 2 sample picks with stakes.`);
    }
    if (a === 'clear') {
      if (!t.classList.contains('is-arm')) { t.classList.add('is-arm'); t.textContent = 'Tap again to remove all'; setTimeout(() => { if (t.isConnected) { t.classList.remove('is-arm'); t.textContent = 'Remove all'; } }, 3000); return; }
      clearSlip();
    }
    return;
  }
  if (t.matches('a[href="#casino"], a[href="#chat"], a[href="#wallet"]')) { e.preventDefault(); toast(`${icon('info', 'ic--sm')} That lives on the main Housebets site. This prototype covers Sports.`); return; }
  if (t.matches('a[href^="#/"]')) {
    navigated = true;
    if ('keepScroll' in ds) { e.preventDefault(); history.replaceState(null, '', t.getAttribute('href')); renderMain({ keepScroll: true }); }
    else if (t.getAttribute('href') === location.hash && ds.league) { e.preventDefault(); renderMain(); }
  }
});
document.addEventListener('focusin', (e) => { const s = e.target.dataset?.stake; if (s) setActive(s); });
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.stake != null) {
    let v = t.value.replace(',', '.').replace(/[^\d.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    if (v.includes('.')) v = v.slice(0, v.indexOf('.') + 3);
    if (v !== t.value) { const p = Math.max(0, t.selectionStart - (t.value.length - v.length)); t.value = v; t.setSelectionRange(p, p); }
    setStake(t.dataset.stake, v);
    patchSlip();
  }
  if (t.dataset.mq != null) {
    state.mq = t.value;
    const ml = $('[data-mlist]');
    const g = currentRoute().q.get('g');
    if (ml) ml.innerHTML = V.marketList(ml.dataset.mlist, g && g !== 'All' ? g : 'All');
  }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.compSelect != null) {
    const p = new URLSearchParams(); if (t.dataset.compSelect !== 'all') p.set('sport', t.dataset.compSelect); if (t.value !== 'all') p.set('comp', t.value);
    navigated = true; location.hash = `#/live${p.toString() ? '?' + p : ''}`; return;
  }
  const k = t.dataset.demo;
  if (!k) return;
  state.demo[k] = t.checked;
  if (k === 'paused') setPaused(t.checked);
  if (k === 'nothingLive' && t.checked) toast(`${icon('clock', 'ic--sm')} Nothing live: see Live, the ticker and Sports home.`);
  renderTicker(); renderMain({ keepScroll: true }); renderSlips({ keepFocus: false });
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    const inPage = $('#main [data-search] input');
    if (inPage && inPage.offsetParent && inPage.getBoundingClientRect().top < innerHeight && inPage.getBoundingClientRect().bottom > 0) inPage.focus();
    else openDlg('search');
  }
});

function demoAct(a) {
  if (a === 'reset') { resetAll(); return; }
  if (a === 'odds') { state.slip.forEach((s, i) => { if (!isSuspended(s.selId) && selection(s.selId)) setOdds(s.selId, oddsOf(s.selId) * (i % 2 ? 0.9 : 1.12)); }); toast(`${icon('refresh', 'ic--sm')} Prices moved in your slip. The player must accept.`, 'is-warn'); }
  if (a === 'suspend-sel') {
    const any = state.slip.find((x) => SUSP.has(x.selId.split('|').slice(0, 2).join('|')));
    const [m, mk] = (any || state.slip[0]).selId.split('|');
    suspendMarket(m, mk, !any);
  }
  if (a === 'suspend-match') suspendMatch('ars-bha', SUSP_MATCH.has('ars-bha') ? null : 'Markets suspended: possible goal under review.');
  if (a === 'goal') { goal('ars-bha', 1); toast(`${icon('football', 'ic--sm')} Goal, Brighton. Markets suspended while prices update.`, 'is-warn'); }
  $('#dlg-demo').close();
  if ((a === 'goal' || a === 'suspend-match') && !(route.name === 'match' && route.id === 'ars-bha')) { navigated = true; location.hash = '#/match/ars-bha'; }
  if ((a === 'odds' || a === 'suspend-sel')) { state.panelTab = 'slip'; if (!mqDesk.matches && route.name !== 'betslip') { navigated = true; location.hash = '#/betslip'; } else renderSlips({ keepFocus: false }); }
}

// ---------- live wiring ----------
const flashT = new Map();
onOdds((ev) => {
  if (ev.type === 'odds') {
    const k = CSS.escape(ev.selId);
    $$(`[data-sel="${k}"]`).forEach(V.patchOdd);
    clearTimeout(flashT.get(ev.selId));
    flashT.set(ev.selId, setTimeout(() => $$(`[data-sel="${k}"]`).forEach(V.patchOdd), 2500));
    patchTraces(ev.selId);
    if (inSlip(ev.selId)) patchSlip();
    if (state.bets.some((b) => b.selId === ev.selId && b.status === 'open')) patchCashouts();
  } else if (ev.type === 'susp') {
    $$(`[data-sel^="${CSS.escape(ev.matchId)}|"]`).forEach(V.patchOdd);
    V.patchMarketStates();
    if (state.slip.some((s) => s.selId.startsWith(ev.matchId + '|'))) patchSlip();
    patchCashouts();
  } else if (ev.type === 'score' || ev.type === 'reprice') {
    renderTicker(); renderMain({ keepScroll: true, keepFocus: true }); renderSlips();
  }
});
subscribe((what) => { if (what === 'slip' || what === 'all') { renderSlips(); $$('[data-sel]').forEach(V.patchOdd); } });
setInterval(() => { if (!state.demo.paused) V.patchClocks(); }, 1000);
window.addEventListener('hashchange', () => { $$('dialog[open]').forEach((d) => d.close()); if (!currentRoute()) return; renderMain(); renderBar(); });

renderTop();
renderTicker();
renderMain();
renderSlips();
startEngine();
