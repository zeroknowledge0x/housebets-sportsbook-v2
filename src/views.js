import { MATCHES, COMPS, SPORTS, TEAMS, comp, sport, match } from './data.js';
import { markets, groupsOf, mainMarket, market, odds, ODDS, hist, isSuspended, marketSuspended, liveInfo, SUSP_MATCH, selection } from './markets.js';
import { state, inSlip, isFollowing, slipSummary, changed, gone, num, cashOutValue, cashOutTrend, eventName, MIN_STAKE, MAX_STAKE } from './store.js';
import { icon, starFilled, crest, logo } from './icons.js';
import { esc, usdt, money, fOdds, time, dayLabel, startsIn, ago } from './util.js';

export const FOOTBALL_COMPS = ['epl', 'ucl', 'lal', 'sea', 'bun'];
export const liveMatches = () => (state.demo.nothingLive ? [] : MATCHES.filter((m) => m.live));
export const soonMatches = (n = 6, sp) => MATCHES.filter((m) => !m.live && (!sp || m.sport === sp)).sort((a, b) => a.start - b.start).slice(0, n);
export const title = (mt) => `${TEAMS[mt.home].name} v ${TEAMS[mt.away].name}`;
const nick = (id) => TEAMS[id].nick;

// ---------- atoms ----------
export const livePill = () => '<span class="live" translate="no">LIVE</span>';
const clockText = (mt, long) => { const li = liveInfo(mt); return li ? (long ? li.long : li.short) : ''; };
export const clock = (mt, long = false) => `<span class="clock" data-clock="${mt.id}" data-fmt="${long ? 'long' : 'short'}">${clockText(mt, long)}</span>`;
export function patchClocks(root = document) {
  root.querySelectorAll('[data-clock]').forEach((el) => {
    const t = clockText(match(el.dataset.clock), el.dataset.fmt === 'long');
    if (el.textContent !== t) el.textContent = t;
  });
}

// a price cell: joined into a bar by its parent
export function cell(o, { label = o.short || o.label, showLabel = true } = {}) {
  const v = odds(o.selId);
  const susp = isSuspended(o.selId);
  const on = inSlip(o.selId);
  const st = ODDS.get(o.selId);
  const recent = st && st.dir && Date.now() - st.ts < 2400 ? st.dir : '';
  return `<button type="button" class="pc${on ? ' is-on' : ''}${susp ? ' is-susp' : ''}${recent ? ' is-' + recent : ''}${showLabel ? '' : ' pc--bare'}" data-sel="${o.selId}" aria-pressed="${on}" ${susp ? 'aria-disabled="true"' : ''} aria-label="${esc(o.label)}, ${susp ? 'suspended' : 'odds ' + fOdds(v)}">
    ${showLabel ? `<span class="pc__l">${esc(label)}</span>` : ''}<span class="pc__v">${susp ? icon('lock', 'ic--xs') : `${recent ? icon(recent, 'pc__dir') : ''}<span class="pc__n">${fOdds(v)}</span>`}</span>
  </button>`;
}
export function patchOdd(btn) {
  const sel = selection(btn.dataset.sel);
  if (!sel) return;
  const tmp = document.createElement('div');
  const bare = btn.classList.contains('pc--bare');
  tmp.innerHTML = cell(sel.outcome, { label: btn.querySelector('.pc__l')?.textContent, showLabel: !bare });
  const nb = tmp.firstElementChild;
  btn.className = nb.className;
  for (const a of ['aria-pressed', 'aria-label']) btn.setAttribute(a, nb.getAttribute(a));
  if (nb.hasAttribute('aria-disabled')) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
  btn.querySelector('.pc__v').innerHTML = nb.querySelector('.pc__v').innerHTML;
}
const bar = (mk, opts = {}) => `<div class="pbar n${mk.outcomes.length}" data-market="${mk.matchId}|${mk.id}">${mk.outcomes.map((o) => cell(o, opts)).join('')}</div>`;

export function spark(vals, { w = 120, h = 32, cls = '', area = false } = {}) {
  if (vals.length < 2) return '';
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return `<svg class="spark ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${area ? `<path class="spark__a" d="${d} L${w} ${h} L0 ${h} Z"/>` : ''}<path class="spark__l" d="${d}"/><circle class="spark__d" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.6"/></svg>`;
}

function followBtn(kind, id, name, { label = true } = {}) {
  const on = isFollowing(kind, id);
  return `<button type="button" class="fol${on ? ' is-on' : ''}${label ? '' : ' fol--icon'}" data-follow="${kind}:${id}" aria-pressed="${on}" aria-label="${on ? 'Unfollow' : 'Follow'} ${esc(name)}">${on ? starFilled('ic--xs') : icon('star', 'ic--xs')}${label ? `<span>${on ? 'Following' : 'Follow'}</span>` : ''}</button>`;
}

// ---------- ticker (shell) ----------
export function ticker() {
  const live = liveMatches();
  if (!live.length) return `<div class="tick__empty">${icon('clock', 'ic--xs')} Nothing live right now. <a href="#/live">See what starts soon</a></div>`;
  return `<ul class="tick__list">${live.map((m) => { const li = liveInfo(m); return `<li><a class="tick__i" href="#/match/${m.id}" aria-label="${esc(title(m))}, ${li.score.join(' ')} , ${clockText(m)}"><span class="tick__dot" aria-hidden="true"></span><span class="tick__t">${esc(TEAMS[m.home].short)}</span><b class="tick__s">${li.score[0]}–${li.score[1]}</b><span class="tick__t">${esc(TEAMS[m.away].short)}</span>${clock(m)}</a></li>`; }).join('')}</ul>`;
}

// ---------- board (dense table) ----------
function boardRow(mt, { showComp = false } = {}) {
  const li = liveInfo(mt);
  const mk = mainMarket(mt.id);
  const extra = markets(mt.id).length - 1;
  const team = (id, side) => `<span class="br__t">${crest(TEAMS[id], 16)}<span class="br__n"><span class="br__nf">${esc(TEAMS[id].name)}</span><span class="br__nn" aria-hidden="true">${esc(TEAMS[id].nick)}</span></span>${isFollowing('teams', id) ? starFilled('ic--xs br__fav') : ''}${li ? `<b class="br__s">${li.score[side]}</b>` : ''}</span>`;
  return `<div class="br${li ? ' br--live' : ''}" data-match="${mt.id}">
    <a class="br__m" href="#/match/${mt.id}" aria-label="${esc(title(mt))}. ${li ? 'Live, ' + clockText(mt) : 'Starts ' + dayLabel(mt.start) + ' ' + time(mt.start)}. Open match">
      <span class="br__w">${li ? `${clock(mt)}<small>${livePill()}</small>` : `<b>${time(mt.start)}</b><small>${startsIn(mt.start).startsWith('In ') ? startsIn(mt.start).replace(' min', 'm') : dayLabel(mt.start).replace('Tomorrow', 'Tmrw')}</small>`}</span>
      <span class="br__ts">${team(mt.home, 0)}${team(mt.away, 1)}${showComp ? `<small class="br__c">${esc(comp(mt.comp).name)}</small>` : ''}</span>
    </a>
    ${bar(mk, { showLabel: false })}
    <a class="br__x" href="#/match/${mt.id}" aria-label="${extra} more markets">+${extra}</a>
  </div>`;
}
function board(list, { head, sub = '', action = '', showComp = false, id = '' } = {}) {
  const n = list[0] ? mainMarket(list[0].id).outcomes.length : 3;
  return `<section class="board"${id ? ` aria-labelledby="${id}"` : ''}>
    <header class="board__h"><h2${id ? ` id="${id}"` : ''}>${head}</h2>${sub ? `<small>${sub}</small>` : ''}${action}<span class="board__cols n${n}" aria-hidden="true">${n === 3 ? '<span>1</span><span>X</span><span>2</span>' : '<span>1</span><span>2</span>'}</span><span class="board__pad" aria-hidden="true"></span></header>
    ${list.map((m) => boardRow(m, { showComp })).join('')}
  </section>`;
}

// ---------- search ----------
export function searchBox(id = 'q') {
  return `<div class="search" data-search>
    <label class="search__box" for="${id}">${icon('search', 'ic--sm')}<span class="sr">Search sports</span>
      <input id="${id}" name="${id}" type="search" role="combobox" aria-expanded="false" aria-controls="${id}-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search teams, players, competitions, markets…" />
      <kbd class="search__kbd" aria-hidden="true">/</kbd>
    </label>
    <div class="search__pop" id="${id}-list" role="listbox" aria-label="Search results" hidden></div>
  </div>`;
}
export function sportsNav(active, cls = '') {
  const items = [['home', '#/', 'Sports home', 'home'], ['live', '#/live', 'Live', 'live', liveMatches().length], ['football', '#/football', 'Football', 'football'],
    ...SPORTS.filter((s) => s.id !== 'football').map((s) => [s.id, `#/sport/${s.id}`, s.name, s.icon, liveMatches().filter((m) => m.sport === s.id).length || null])];
  return `<nav class="snav ${cls}" aria-label="Sports"><ul>${items.map(([id, href, name, ic, n]) => `<li><a href="${href}" class="snav__i${active === id ? ' is-on' : ''}" data-nav="${id}"${active === id ? ' aria-current="page"' : ''}>${icon(ic, 'ic--sm')}<span>${name}</span>${n ? `<b>${n}</b>` : ''}</a></li>`).join('')}</ul></nav>`;
}

// ---------- 1 · Sports home: live pulse ----------
export function pageHome() {
  const live = liveMatches();
  const hero = live.find((m) => m.id === 'ars-bha') || live[0];
  const also = live.filter((m) => m !== hero && m.sport === 'football').slice(0, 4);
  const fav = [...state.follows.comps.map((c) => ['comps', c, comp(c).name]), ...state.follows.teams.map((t) => ['teams', t, TEAMS[t].name])];
  const yours = MATCHES.filter((m) => (state.follows.teams.includes(m.home) || state.follows.teams.includes(m.away) || state.follows.comps.includes(m.comp)) && !(state.demo.nothingLive && m.live))
    .sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || (a.start || 0) - (b.start || 0)).slice(0, 4);
  return `<h1 class="sr" tabindex="-1">Sports home</h1>
    <div class="home-search">${searchBox('q-home')}</div>
    ${sportsNav('home', 'snav--chips')}
    ${hero ? pulse(hero, also) : `<section class="pulse pulse--empty" aria-labelledby="h-pulse"><div class="pulse__none">${icon('clock')}<div><h2 id="h-pulse">Nothing live right now</h2><p>The next kick-offs are below. Prices are open now.</p></div></div></section>`}
    <div class="duo">
      ${board(soonMatches(6), { head: 'Starting soon', id: 'h-soon', showComp: true })}
      <section class="topc" aria-labelledby="h-topc"><header class="sec-h"><h2 id="h-topc">Top competitions</h2></header>
        <ul>${FOOTBALL_COMPS.map((id) => { const c = comp(id); const ln = liveMatches().filter((m) => m.comp === id).length; return `<li><a href="#/football?league=${id}" data-league="${id}"><span class="topc__n">${esc(c.name)}</span><small>${esc(c.region)}</small>${ln ? `<span class="topc__l">${ln} live</span>` : ''}${icon('right', 'ic--xs')}</a>${followBtn('comps', id, c.name, { label: false })}</li>`; }).join('')}</ul>
      </section>
    </div>
    <section class="favs" aria-labelledby="h-fav"><header class="sec-h"><h2 id="h-fav">Favourites</h2><a class="sec-h__a" href="#/football">Follow more</a></header>
      ${fav.length ? `<ul class="favs__chips">${fav.map(([k, id, name]) => `<li>${k === 'teams' ? crest(TEAMS[id], 16) : starFilled('ic--xs favs__star')}<a href="${k === 'teams' ? `#/football?team=${id}` : `#/football?league=${id}`}">${esc(name)}</a><button type="button" data-follow="${k}:${id}" aria-label="Unfollow ${esc(name)}">${icon('x', 'ic--xs')}</button></li>`).join('')}</ul>` : `<p class="hint">${icon('star', 'ic--xs')} Star a team or competition on Football to pin it here.</p>`}
      ${yours.length ? board(yours, { head: 'Your matches', sub: `${yours.length} matches`, showComp: true }) : ''}
    </section>`;
}
function pulse(mt, also) {
  const li = liveInfo(mt);
  const mk = mainMarket(mt.id);
  const ng = markets(mt.id).find((m) => m.id === 'ng');
  const h = hist(mk.outcomes[0].selId);
  const first = h[0], last = h[h.length - 1];
  const H = TEAMS[mt.home], A = TEAMS[mt.away];
  return `<section class="pulse" aria-labelledby="h-pulse" data-pulse="${mt.id}">
    <div class="pulse__main">
      <header class="pulse__top"><span class="pulse__tag">${livePill()} ${esc(comp(mt.comp).name)}</span><span class="pulse__per">${esc(li.period)}</span></header>
      <a class="pulse__score" href="#/match/${mt.id}" id="h-pulse" aria-label="${esc(title(mt))}, ${li.score[0]} to ${li.score[1]}. Open match">
        <span class="pulse__team">${crest(H, 40)}<span>${esc(H.nick)}</span></span>
        <span class="pulse__nums"><b>${li.score[0]}</b><i>–</i><b>${li.score[1]}</b><span class="pulse__clock">${clock(mt, true)}</span></span>
        <span class="pulse__team pulse__team--a"><span>${esc(A.nick)}</span>${crest(A, 40)}</span>
      </a>
      <div class="pulse__bar">${bar(mk)}</div>
      <div class="pulse__foot">
        <div class="pulse__trace"><span class="pulse__tl">${esc(H.nick)} to win, last ${h.length} price moves</span><span class="pulse__tv" data-trace="${mk.outcomes[0].selId}">${spark(h, { w: 240, h: 40, area: true, cls: 'spark--hero' })}<b class="${last <= first ? 'pos' : 'neg'}">${fOdds(first)} → ${fOdds(last)}</b></span></div>
        ${ng ? `<div class="pulse__ng"><span class="pulse__tl">${esc(ng.name)}</span>${bar(ng)}</div>` : ''}
      </div>
      <a class="pulse__go" href="#/match/${mt.id}">All ${markets(mt.id).length} markets ${icon('right', 'ic--xs')}</a>
    </div>
    ${also.length ? `<aside class="pulse__also" aria-label="Also live"><h2 class="pulse__ah">Also live <a href="#/live">${liveMatches().length} in play</a></h2><ul>${also.map((m) => { const l = liveInfo(m); const p = mainMarket(m.id).outcomes[0]; return `<li><a href="#/match/${m.id}" class="also__m"><span class="also__t"><span>${esc(nick(m.home))}</span><span>${esc(nick(m.away))}</span></span><span class="also__s"><b>${l.score[0]}</b><b>${l.score[1]}</b></span>${clock(m)}</a>${cell(p, { label: '1' })}</li>`; }).join('')}</ul></aside>` : ''}
  </section>`;
}

// ---------- 2 · Live ----------
export function pageLive(q) {
  const sp = q.get('sport') || 'all';
  const cp = q.get('comp') || 'all';
  const all = liveMatches();
  const bySport = sp === 'all' ? all : all.filter((m) => m.sport === sp);
  const list = cp === 'all' ? bySport : bySport.filter((m) => m.comp === cp);
  const compsHere = [...new Set(bySport.map((m) => m.comp))];
  const href = (s, c) => { const p = new URLSearchParams(); if (s !== 'all') p.set('sport', s); if (c !== 'all') p.set('comp', c); return `#/live${p.toString() ? '?' + p : ''}`; };
  const groups = [...new Set(list.map((m) => m.comp))];
  return `<header class="ph"><h1 tabindex="-1">Live <span class="ph__n">${all.length}</span></h1><p>Every match in play, scores and clocks as they happen.</p></header>
    <div class="fbar">
      <nav class="fbar__sports" aria-label="Filter by sport">${[['all', 'All', 'live', all.length], ...SPORTS.map((s) => [s.id, s.name, s.icon, all.filter((m) => m.sport === s.id).length])].map(([id, n, ic, c]) => `<a href="${href(id, 'all')}" class="fbar__s${sp === id ? ' is-on' : ''}${c ? '' : ' is-zero'}"${sp === id ? ' aria-current="true"' : ''}>${icon(ic, 'ic--xs')}<span>${n}</span><b>${c}</b></a>`).join('')}</nav>
      <label class="fbar__comp"><span>Competition</span><select data-comp-select="${sp}" name="comp">${['all', ...compsHere].map((c) => `<option value="${c}"${cp === c ? ' selected' : ''}>${c === 'all' ? `All competitions (${bySport.length})` : `${esc(comp(c).name)} (${bySport.filter((m) => m.comp === c).length})`}</option>`).join('')}</select></label>
    </div>
    ${list.length ? groups.map((g) => { const c = comp(g); return board(list.filter((m) => m.comp === g), { head: `${icon(sport(c.sport).icon, 'ic--xs')} ${esc(c.name)}`, sub: esc(c.region) }); }).join('')
      : `<div class="none">${icon('clock')}<div><h2>Nothing live${sp === 'all' ? '' : ' in ' + esc(sport(sp).name.toLowerCase())} right now</h2><p>These start soon. You can bet on them now.</p></div></div>${soonMatches(6, sp === 'all' ? null : sp).length ? board(soonMatches(6, sp === 'all' ? null : sp), { head: 'Starting soon', showComp: true }) : `<p class="hint">No matches in the next few hours. <a href="#/live">Show all sports</a></p>`}`}`;
}

// ---------- 3 · Football (and other sports) ----------
export function pageSport(id, q) {
  const isF = id === 'football';
  const s = sport(id);
  const comps = isF ? FOOTBALL_COMPS : COMPS.filter((c) => c.sport === id).map((c) => c.id);
  const team = q.get('team');
  const onlyFollowed = q.get('show') === 'following';
  const tables = comps.map((cid) => {
    const c = comp(cid);
    if (onlyFollowed && !isFollowing('comps', cid)) {
      const hasTeam = MATCHES.some((m) => m.comp === cid && (isFollowing('teams', m.home) || isFollowing('teams', m.away)));
      if (!hasTeam) return '';
    }
    let list = MATCHES.filter((m) => m.comp === cid && !(state.demo.nothingLive && m.live));
    if (team) list = list.filter((m) => m.home === team || m.away === team);
    if (onlyFollowed && !isFollowing('comps', cid)) list = list.filter((m) => isFollowing('teams', m.home) || isFollowing('teams', m.away));
    if (!list.length && (team || onlyFollowed)) return '';
    list.sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || (a.start || 0) - (b.start || 0));
    const teamsIn = [...new Set(MATCHES.filter((m) => m.comp === cid).flatMap((m) => [m.home, m.away]))];
    return `<div class="league" id="${cid}">${board(list, { head: esc(c.name), sub: esc(c.region), id: 'lg-' + cid, action: followBtn('comps', cid, c.name) })}
      ${isF ? `<details class="tfol" id="tf-${cid}"><summary>${icon('star', 'ic--xs')} Follow a team in ${esc(c.name)}</summary><ul>${teamsIn.map((t) => { const on = isFollowing('teams', t); return `<li><button type="button" class="tfol__b${on ? ' is-on' : ''}" data-follow="teams:${t}" aria-pressed="${on}">${crest(TEAMS[t], 16)}${esc(TEAMS[t].name)}${on ? starFilled('ic--xs') : icon('star', 'ic--xs')}</button></li>`; }).join('')}</ul></details>` : ''}</div>`;
  }).join('');
  const qs = (o) => { const p = new URLSearchParams(o); return p.toString() ? '?' + p : ''; };
  return `<header class="ph"><h1 tabindex="-1">${esc(s.name)}</h1><p>${isF ? 'Five leagues, one line per match. Match result odds on every row.' : 'Winner odds on every row.'}</p></header>
    ${isF ? `<div class="jump"><nav class="jump__l" aria-label="Jump to league">${FOOTBALL_COMPS.map((c) => `<a href="#/football${team ? qs({ team }) : ''}#${c}" data-league="${c}">${esc(comp(c).name)}</a>`).join('')}</nav>
      <div class="jump__f" role="group" aria-label="Show"><a href="#/football" class="${onlyFollowed || team ? '' : 'is-on'}" ${onlyFollowed || team ? '' : 'aria-current="true"'}>All</a><a href="#/football?show=following" class="${onlyFollowed ? 'is-on' : ''}" ${onlyFollowed ? 'aria-current="true"' : ''}>${starFilled('ic--xs')} Following</a></div></div>` : ''}
    ${team && TEAMS[team] ? `<div class="note">${crest(TEAMS[team], 18)}<span>Matches for <b>${esc(TEAMS[team].name)}</b></span>${followBtn('teams', team, TEAMS[team].name)}<a href="#/football" aria-label="Clear team filter">${icon('x', 'ic--xs')}</a></div>` : ''}
    ${tables || `<div class="none">${icon('star')}<div><h2>Nothing followed yet</h2><p>Tap Follow on a league or star a team, and it shows here and on Sports home.</p></div></div>`}`;
}

// ---------- 4 · Match page ----------
export function pageMatch(id, q) {
  const mt = match(id);
  if (!mt) return `<div class="none">${icon('alert')}<div><h2>Match not found</h2><p>It may have finished. <a href="#/live">Go to Live</a></p></div></div>`;
  const groups = groupsOf(id);
  const g = q.get('g') && groups.includes(q.get('g')) ? q.get('g') : 'All';
  const li = liveInfo(mt);
  const H = TEAMS[mt.home], A = TEAMS[mt.away];
  const susp = SUSP_MATCH.get(id);
  const mr = mainMarket(id);
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="${mt.sport === 'football' ? '#/football' : '#/sport/' + mt.sport}">${esc(sport(mt.sport).name)}</a><span aria-hidden="true">/</span><a href="${mt.sport === 'football' ? '#/football?league=' + mt.comp : '#/sport/' + mt.sport}">${esc(comp(mt.comp).name)}</a></nav>
    <section class="mh${li ? ' mh--live' : ''}" aria-labelledby="mh-t">
      <h1 class="sr" id="mh-t" tabindex="-1">${esc(title(mt))}${li ? ', live' : ''}</h1>
      <div class="mh__row">
        <div class="mh__team">${crest(H, 56)}<h2>${esc(H.name)}</h2>${followBtn('teams', H.id, H.name, { label: false })}</div>
        <div class="mh__mid">${li ? `<div class="mh__score" aria-label="Score ${li.score[0]} to ${li.score[1]}"><b>${li.score[0]}</b><i>:</i><b>${li.score[1]}</b></div><div class="mh__clock">${livePill()} ${clock(mt, true)} <span>${esc(li.period)}</span></div>${mt.sport === 'tennis' ? `<div class="mh__sets">${li.sets.map(([a, b]) => `<span>${a}–${b}</span>`).join('')}<span class="mh__pts">${esc(li.points.join('–'))}</span></div>` : ''}`
          : `<div class="mh__ko"><b>${time(mt.start)}</b><span>${startsIn(mt.start)}</span></div>`}</div>
        <div class="mh__team mh__team--a">${crest(A, 56)}<h2>${esc(A.name)}</h2>${followBtn('teams', A.id, A.name, { label: false })}</div>
      </div>
      <div class="mh__susp" data-susp-banner="${id}" role="status"${susp ? '' : ' hidden'}>${icon('lock', 'ic--sm')}<span>${esc(susp || '')}</span></div>
    </section>
    <div class="pin" data-pin>
      <div class="pin__sc" aria-hidden="true"><span>${esc(H.short)}</span><b>${li ? `${li.score[0]}–${li.score[1]}` : time(mt.start)}</b><span>${esc(A.short)}</span>${li ? clock(mt) : ''}</div>
      <div class="pin__mk"><span class="pin__name">${esc(mr.name)}<span class="mkt__state" data-mstate="${id}|mr">${marketSuspended(id, 'mr') ? `${icon('lock', 'ic--xs')} Suspended` : ''}</span></span>${bar(mr)}</div>
    </div>
    <div class="mtool">
      <nav class="mtool__g" aria-label="Market groups">${['All', ...groups].map((x) => `<a href="#/match/${id}${x === 'All' ? '' : '?g=' + encodeURIComponent(x)}" class="${x === g ? 'is-on' : ''}"${x === g ? ' aria-current="true"' : ''} data-keep-scroll>${esc(x)}</a>`).join('')}</nav>
      <div class="mtool__r">
        <label class="msearch">${icon('search', 'ic--xs')}<span class="sr">Find a market</span><input type="search" name="mq" data-mq placeholder="Find a market, e.g. corners…" value="${esc(state.mq)}" autocomplete="off" spellcheck="false" /></label>
        <button type="button" class="tbtn" data-collapse-all="${id}">${state.collapsed.size ? 'Expand all' : 'Collapse all'}</button>
      </div>
    </div>
    <div class="mlist" data-mlist="${id}">${marketList(id, g)}</div>`;
}
export function marketList(id, g) {
  const q = state.mq.trim().toLowerCase();
  const list = markets(id).filter((m) => m.id !== 'mr' && (g === 'All' || m.group === g) && (!q || m.name.toLowerCase().includes(q) || m.group.toLowerCase().includes(q) || m.outcomes.some((o) => o.label.toLowerCase().includes(q))));
  if (!list.length) return `<div class="none">${icon('search')}<div><h2>No markets match “${esc(state.mq)}”</h2><p>Try goals, corners, cards, handicap or a player name.</p></div></div>`;
  let lastGroup = '';
  return list.map((mk) => {
    const head = g === 'All' && mk.group !== lastGroup ? `<h3 class="mgrp">${esc(mk.group)}</h3>` : '';
    lastGroup = mk.group;
    return head + marketBlock(mk);
  }).join('');
}
function marketBlock(mk) {
  const susp = marketSuspended(mk.matchId, mk.id);
  const open = !state.collapsed.has(mk.id);
  let body;
  if (mk.closed) body = `<p class="mk__closed">${icon('check', 'ic--xs')} ${esc(mk.closed)}</p>`;
  else if (mk.kind === 'players') {
    const rows = [];
    for (let i = 0; i < mk.outcomes.length; i += 2) rows.push([mk.outcomes[i], mk.outcomes[i + 1]]);
    body = `<div class="pl"><div class="pl__h"><span>Player</span><span>${esc(mk.outcomes[0].col)}</span><span>${esc(mk.outcomes[1].col)}</span></div>${rows.map(([a, b]) => `<div class="pl__r"><span class="pl__n">${esc(a.player)} <small>${esc(a.team)}</small></span><div class="pbar n2">${cell(a, { showLabel: false })}${cell(b, { showLabel: false })}</div></div>`).join('')}</div>`;
  } else body = mk.outcomes.length > 3 ? `<div class="pgrid">${mk.outcomes.map((o) => cell(o)).join('')}</div>` : bar(mk);
  return `<section class="mk${susp ? ' is-susp' : ''}${mk.closed ? ' is-closed' : ''}${open ? '' : ' is-col'}" data-market="${mk.matchId}|${mk.id}">
    <h4 class="mk__h"><button type="button" data-toggle-mk="${mk.id}" aria-expanded="${open}">${icon('chevUp', 'ic--xs mk__chev')}<span>${esc(mk.name)}</span><span class="mkt__state" role="status">${susp ? `${icon('lock', 'ic--xs')} Suspended` : ''}</span></button></h4>
    <div class="mk__b"${open ? '' : ' hidden'}>${body}</div>
  </section>`;
}
export function patchMarketStates(root = document) {
  root.querySelectorAll('[data-market]').forEach((el) => {
    const [mid, mkid] = el.dataset.market.split('|');
    const s = marketSuspended(mid, mkid);
    el.classList.toggle('is-susp', s);
    const st = el.querySelector('.mkt__state');
    if (st) st.innerHTML = s ? `${icon('lock', 'ic--xs')} Suspended` : '';
  });
  root.querySelectorAll('[data-mstate]').forEach((el) => {
    const [mid, mkid] = el.dataset.mstate.split('|');
    el.innerHTML = marketSuspended(mid, mkid) ? `${icon('lock', 'ic--xs')} Suspended` : '';
  });
  root.querySelectorAll('[data-susp-banner]').forEach((el) => {
    const r = SUSP_MATCH.get(el.dataset.suspBanner);
    el.hidden = !r;
    el.querySelector('span').textContent = r || '';
  });
}

// ---------- 5 · Bet slip + My bets ----------
export function slipPanel() {
  const openN = state.bets.filter((b) => b.status === 'open').length;
  const tab = state.panelTab;
  return `<div class="bs">
    <div class="bs__sw" role="group" aria-label="Bet slip or my bets">
      <button type="button" class="${tab === 'slip' ? 'is-on' : ''}" aria-pressed="${tab === 'slip'}" data-ptab="slip">Bet slip<b>${state.slip.length}</b></button>
      <button type="button" class="${tab === 'bets' ? 'is-on' : ''}" aria-pressed="${tab === 'bets'}" data-ptab="bets">My bets<b>${openN}</b></button>
    </div>
    <div class="bs__body">${tab === 'slip' ? slipBody() : myBets()}</div>
  </div>`;
}
export function betslipPage() {
  const openN = state.bets.filter((b) => b.status === 'open').length;
  return `<header class="ph"><h1 tabindex="-1">Bet slip &amp; My bets</h1><p>Singles only · decimal odds · stakes in demo USDT (no real money).</p></header>
    <div class="bsp">
      <div class="bs__sw bsp__sw" role="group" aria-label="Bet slip or my bets">
        <button type="button" class="${state.panelTab === 'slip' ? 'is-on' : ''}" aria-pressed="${state.panelTab === 'slip'}" data-ptab="slip">Bet slip<b>${state.slip.length}</b></button>
        <button type="button" class="${state.panelTab === 'bets' ? 'is-on' : ''}" aria-pressed="${state.panelTab === 'bets'}" data-ptab="bets">My bets<b>${openN}</b></button>
      </div>
      <section class="bsp__c bsp__c--slip${state.panelTab === 'slip' ? ' is-on' : ''}" aria-labelledby="bsp-s"><h2 id="bsp-s" class="bsp__h">Bet slip <span>${state.slip.length}</span></h2>${slipBody()}</section>
      <section class="bsp__c bsp__c--bets${state.panelTab === 'bets' ? ' is-on' : ''}" aria-labelledby="bsp-b"><h2 id="bsp-b" class="bsp__h">My bets <span>${openN} open</span></h2>${myBets()}</section>
    </div>`;
}
export function slipBody() {
  const st = state.slipStatus;
  if (st && st.ok) return receipt(st);
  if (!state.slip.length) {
    return `<div class="bse"><svg class="bse__art" viewBox="0 0 120 40" aria-hidden="true"><path d="M0 30c12 0 18-6 24-14 7-10 16-14 26-10-6 1-10 5-11 10 6-5 14-6 20-2-5 0-9 3-10 7 8-3 15-1 20 4-7-1-13 1-17 5z"/></svg>
      <h3>Your slip is empty</h3><p>Tap any price to add a single. Your stake goes in with the keypad.</p>
      <div class="bse__a"><button type="button" class="btn" data-act="sample">Add 2 sample picks</button><a class="btn btn--line" href="#/match/ars-bha">Arsenal v Brighton</a></div></div>`;
  }
  const active = state.slip.find((s) => s.selId === state.activeStake) || state.slip[0];
  return `<div class="slip">
    ${st && !st.ok ? `<div class="err" role="alert">${icon('alert', 'ic--sm')}<div><b>Bet failed. Nothing was taken from your balance.</b><p>${esc(st.msg)}</p><div class="err__a"><button type="button" class="btn btn--sm" data-act="place">Try again</button><button type="button" class="btn btn--sm btn--line" data-act="dismiss">Dismiss</button></div></div></div>` : ''}
    <p class="slip__n">Singles only. Each pick is its own bet. <button type="button" class="lnk" data-act="clear">Remove all</button></p>
    <ul class="slip__l">${state.slip.map((s) => slipItem(s, s === active)).join('')}</ul>
  </div>
  <div class="slip__k" data-keypad>${keypadUI(active)}</div>
  <div class="slip__f" data-slip-foot>${slipFoot()}</div>`;
}
function slipItem(s, isActive) {
  const mt = match(s.matchId);
  const li = mt && liveInfo(mt);
  return `<li class="si${isActive ? ' is-act' : ''}" data-slip="${s.selId}">
    <div class="si__h">
      <div class="si__w"><b>${esc(s.label)}</b><span>${esc(s.marketName)}</span><a href="#/match/${s.matchId}">${li ? `${livePill()} ${li.score.join('–')} · ` : ''}${esc(s.event)}</a></div>
      <div class="si__o" data-slip-odds="${s.selId}">${slipOdds(s)}</div>
      <button type="button" class="x" data-remove="${s.selId}" aria-label="Remove ${esc(s.label)}">${icon('x', 'ic--xs')}</button>
    </div>
    <div class="si__msg" data-slip-msg="${s.selId}">${slipMsg(s)}</div>
    <div class="si__s">
      <label class="stake${isActive ? ' is-act' : ''}"><span class="stake__l">Stake</span><input type="text" inputmode="decimal" name="stake-${s.selId}" data-stake="${s.selId}" value="${esc(s.stake)}" placeholder="0.00" autocomplete="off" maxlength="9" aria-label="Stake for ${esc(s.label)} in USDT" /><span class="stake__u">USDT</span></label>
      <div class="si__r"><span>Returns</span><b data-ret="${s.selId}">${retText(s)}</b></div>
    </div>
    <p class="si__e" data-stake-err="${s.selId}" aria-live="polite">${stakeErr(s)}</p>
  </li>`;
}
export function keypadUI(active) {
  if (!active) return '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  return `<p class="kp__for">Keypad: stake for <b>${esc(active.label)}</b></p>
    <div class="kp__q" role="group" aria-label="Quick stakes in USDT">${['+5', '+10', '+25', '+50', 'max'].map((k) => `<button type="button" data-key="${k}">${k === 'max' ? 'Max' : k}</button>`).join('')}</div>
    <div class="kp" role="group" aria-label="Stake keypad">${keys.map((k) => `<button type="button" data-key="${k}" ${k === 'del' ? 'aria-label="Delete last digit"' : ''}>${k === 'del' ? icon('left', 'ic--sm') : k}</button>`).join('')}</div>`;
}
export function slipOdds(s) {
  if (gone(s) || isSuspended(s.selId)) return `<span class="so so--s">${icon('lock', 'ic--xs')}<s>${fOdds(s.accepted)}</s></span>`;
  const v = odds(s.selId);
  if (v !== s.accepted) { const up = v > s.accepted; return `<span class="so so--${up ? 'up' : 'dn'}"><s>${fOdds(s.accepted)}</s>${icon(up ? 'up' : 'down', 'ic--xs')}<b>${fOdds(v)}</b></span>`; }
  return `<span class="so"><b>${fOdds(v)}</b></span>`;
}
export function slipMsg(s) {
  const sel = selection(s.selId);
  if (!sel) return `<p class="m m--s">${icon('lock', 'ic--xs')} This market closed after the last goal. Remove it to place the others.</p>`;
  if (isSuspended(s.selId)) return `<p class="m m--s">${icon('lock', 'ic--xs')} Suspended. Betting is paused on this market and usually reopens in seconds.</p>`;
  if (changed(s)) return `<p class="m m--c">${icon('refresh', 'ic--xs')} Price moved ${fOdds(s.accepted)} → ${fOdds(odds(s.selId))}. Accept it to place this bet.</p>`;
  return '';
}
export function retText(s) { const n = num(s.stake); if (!n || gone(s)) return '–'; return usdt(n * (isSuspended(s.selId) ? s.accepted : odds(s.selId))); }
export function stakeErr(s) {
  const n = num(s.stake);
  if (n && n < MIN_STAKE) return `Minimum stake is ${usdt(MIN_STAKE)}.`;
  if (n > MAX_STAKE) return `Maximum stake is ${usdt(MAX_STAKE)} per bet.`;
  return '';
}
export function slipFoot() {
  const sm = slipSummary();
  const st = state.slipStatus;
  let btn;
  if (state.demo.signedOut) btn = `<button type="button" class="btn btn--big" data-act="login">Log in to place bets</button>`;
  else if (st === 'placing') btn = `<button type="button" class="btn btn--big is-busy" aria-disabled="true"><span class="spin" aria-hidden="true"></span>Placing bets…</button>`;
  else if (sm.issues.changed) btn = `<button type="button" class="btn btn--big btn--sig" data-act="accept">${icon('refresh', 'ic--sm')} Accept new prices</button>`;
  else if (sm.issues.suspended && !sm.ready) btn = `<button type="button" class="btn btn--big" disabled>Selection suspended</button>`;
  else if (sm.issues.tooLow || sm.issues.tooHigh) btn = `<button type="button" class="btn btn--big" disabled>Check your stakes</button>`;
  else if (!sm.ready) btn = `<button type="button" class="btn btn--big" disabled>Enter a stake</button>`;
  else if (sm.overBalance) btn = `<button type="button" class="btn btn--big" disabled>Not enough balance</button>`;
  else btn = `<button type="button" class="btn btn--big" data-act="place">Place ${sm.ready} bet${sm.ready === 1 ? '' : 's'}<span>${usdt(sm.stake)}</span></button>`;
  const notes = [];
  if (sm.issues.changed) notes.push(`<p class="fn fn--c">${icon('refresh', 'ic--xs')} ${sm.issues.changed} price${sm.issues.changed === 1 ? '' : 's'} changed. You need to accept before placing.</p>`);
  if (sm.issues.suspended) notes.push(`<p class="fn fn--s">${icon('lock', 'ic--xs')} ${sm.issues.suspended} suspended pick${sm.issues.suspended === 1 ? '' : 's'} won’t be placed${sm.ready ? '; the rest will' : ''}.</p>`);
  if (sm.overBalance) notes.push(`<p class="fn fn--e">${icon('alert', 'ic--xs')} Total stake is more than your ${usdt(state.balance)} balance.</p>`);
  return `<div class="ft"><span>Total stake <b>${usdt(sm.stake)}</b></span><span class="ft__r">Potential return <b>${usdt(sm.ret)}</b></span></div>${notes.join('')}${btn}`;
}
function receipt(st) {
  const tot = st.placed.reduce((a, p) => a + p.stake, 0);
  const ret = st.placed.reduce((a, p) => a + p.stake * p.odds, 0);
  const ts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
  return `<div class="rc" role="status">
    <div class="rc__paper">
      <div class="rc__top">${logo(true)}<span class="rc__ok">${icon('check', 'ic--sm')} Bet${st.placed.length === 1 ? '' : 's'} placed</span></div>
      <p class="rc__ts">${ts} · ${st.placed.length} single${st.placed.length === 1 ? '' : 's'}</p>
      <ul>${st.placed.map((p) => `<li><div><b>${esc(p.pick)}</b><small>${esc(p.event)}</small><small>${p.id}</small></div><div class="rc__n"><span>${usdt(p.stake)} @ ${fOdds(p.odds)}</span><b>${usdt(p.stake * p.odds)}</b></div></li>`).join('')}</ul>
      <dl><div><dt>Total stake</dt><dd>${usdt(tot)}</dd></div><div><dt>Potential return</dt><dd>${usdt(ret)}</dd></div><div><dt>New balance</dt><dd>${usdt(state.balance)}</dd></div></dl>
    </div>
    <div class="rc__a"><button type="button" class="btn btn--line" data-act="view-bets">Track in My bets</button><button type="button" class="btn" data-act="dismiss">Done</button></div>
  </div>`;
}
export function myBets() {
  const tab = state.betsTab;
  const open = state.bets.filter((b) => b.status === 'open');
  const settled = state.bets.filter((b) => b.status !== 'open');
  const list = tab === 'open' ? open : settled;
  return `<div class="mb">
    <div class="mb__t" role="group" aria-label="Bet status"><button type="button" class="${tab === 'open' ? 'is-on' : ''}" aria-pressed="${tab === 'open'}" data-btab="open">Open <b>${open.length}</b></button><button type="button" class="${tab === 'settled' ? 'is-on' : ''}" aria-pressed="${tab === 'settled'}" data-btab="settled">Settled <b>${settled.length}</b></button></div>
    ${list.length ? `<ul class="mb__l">${list.map(betCard).join('')}</ul>` : `<div class="bse"><h3>${tab === 'open' ? 'No open bets' : 'Nothing settled yet'}</h3><p>${tab === 'open' ? 'Bets you place show here with a live cash-out value.' : 'Won, lost and cashed-out bets land here.'}</p></div>`}
  </div>`;
}
function betCard(b) {
  const mt = b.matchId && match(b.matchId);
  const li = mt && b.status === 'open' && liveInfo(mt);
  const pill = { won: 'Won', lost: 'Lost', cashed: 'Cashed out' }[b.status];
  return `<li class="bc bc--${b.status}" data-bet="${b.id}">
    <div class="bc__h"><div><b>${esc(b.pick)}</b><span>${esc(b.market)}</span></div><b class="bc__o">${fOdds(b.odds)}</b></div>
    <p class="bc__e">${li ? `${livePill()} <b>${li.score.join('–')}</b> ${clock(mt)} · ` : ''}${esc(eventName(b))}</p>
    <div class="bc__n"><span>Stake <b>${usdt(b.stake)}</b></span><span>${b.status === 'open' ? 'To return' : 'Returned'} <b>${usdt(b.status === 'open' ? b.stake * b.odds : b.ret)}</b></span></div>
    ${b.status === 'open' ? `<div data-co="${b.id}">${cashOutUI(b)}</div>` : `<p class="bc__f"><span class="tag tag--${b.status}">${pill}</span><small>${b.id} · ${ago(b.settledAt || b.placed)}</small></p>`}
  </li>`;
}
export function cashOutUI(b) {
  const v = cashOutValue(b);
  if (v == null) return `<p class="co__na">${icon('info', 'ic--xs')} Cash out isn’t offered on this bet.</p>`;
  const tr = cashOutTrend(b);
  const prev = tr.length > 1 ? tr[tr.length - 2] : v;
  const diff = v - b.stake;
  const trend = `<div class="co__tr"><span class="co__lbl">Cash-out value</span>${spark(tr, { w: 120, h: 28, cls: v >= tr[0] ? 'spark--up' : 'spark--dn' })}<span class="co__v"><b>${usdt(v)}</b><small class="${v >= prev ? 'pos' : 'neg'}">${icon(v >= prev ? 'up' : 'down', 'ic--xs')}${money(Math.abs(v - prev))}</small></span></div>`;
  if (isSuspended(b.selId)) return `${trend}<button type="button" class="btn btn--co" disabled>${icon('lock', 'ic--xs')} Cash out suspended</button>`;
  if (state.cashing === b.id) return `${trend}<div class="co__c" role="group" aria-label="Confirm cash out"><p>Take <b>${usdt(v)}</b> now and close this bet?</p><div><button type="button" class="btn btn--sm" data-cash-yes="${b.id}">Confirm cash out</button><button type="button" class="btn btn--sm btn--line" data-cash-no="${b.id}">Keep bet</button></div></div>`;
  return `${trend}<button type="button" class="btn btn--co" data-cash="${b.id}">Cash out ${usdt(v)} <small class="${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '+' : '−'}${money(Math.abs(diff))}</small></button>`;
}
export { logo, icon, crest };
