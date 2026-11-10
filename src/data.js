// Sample data only. Club names are used as labels; every player name is invented.
// No real money: balances and stakes are demo USDT.

export function rng(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SPORTS = [
  { id: 'football', name: 'Football', icon: 'football' },
  { id: 'tennis', name: 'Tennis', icon: 'tennis' },
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'icehockey', name: 'Ice hockey', icon: 'hockey' },
  { id: 'esports', name: 'Esports', icon: 'esports' },
];

export const COMPS = [
  { id: 'epl', sport: 'football', name: 'Premier League', region: 'England', top: true },
  { id: 'ucl', sport: 'football', name: 'Champions League', region: 'Europe', top: true },
  { id: 'lal', sport: 'football', name: 'LaLiga', region: 'Spain', top: true },
  { id: 'sea', sport: 'football', name: 'Serie A', region: 'Italy', top: true },
  { id: 'bun', sport: 'football', name: 'Bundesliga', region: 'Germany', top: true },
  { id: 'ere', sport: 'football', name: 'Eredivisie', region: 'Netherlands' },
  { id: 'atp', sport: 'tennis', name: 'Harbour Open', region: 'Men’s singles' },
  { id: 'wta', sport: 'tennis', name: 'Coastline Cup', region: 'Women’s singles' },
  { id: 'nbl', sport: 'basketball', name: 'Pacific Hoops League', region: 'International' },
  { id: 'ihl', sport: 'icehockey', name: 'Northern Ice League', region: 'International' },
  { id: 'cs2', sport: 'esports', name: 'Counter-Strike 2 · Tide Masters', region: 'Online' },
];
export const comp = (id) => COMPS.find((c) => c.id === id);
export const sport = (id) => SPORTS.find((s) => s.id === id);

// [id, name, short, colour A, colour B, crest pattern, strength]
const T = [
  ['ars', 'Arsenal', 'ARS', '#e0313b', '#ffffff', 'chevron', 86],
  ['bha', 'Brighton & Hove Albion', 'BHA', '#1b5fd1', '#ffffff', 'stripes', 74],
  ['liv', 'Liverpool', 'LIV', '#c8102e', '#f6c343', 'band', 87],
  ['mun', 'Manchester United', 'MUN', '#d8262f', '#111111', 'split', 76],
  ['mci', 'Manchester City', 'MCI', '#6cb4ee', '#0b2a4a', 'band', 88],
  ['tot', 'Tottenham Hotspur', 'TOT', '#f4f6f8', '#132257', 'chevron', 77],
  ['che', 'Chelsea', 'CHE', '#1d3fbb', '#ffffff', 'ring', 80],
  ['new', 'Newcastle United', 'NEW', '#111111', '#f4f4f4', 'stripes', 78],
  ['avl', 'Aston Villa', 'AVL', '#7a1f3d', '#93c5ef', 'split', 79],
  ['whu', 'West Ham United', 'WHU', '#7a263a', '#1bb1e7', 'chevron', 72],
  ['rma', 'Real Madrid', 'RMA', '#f5f5f5', '#c9a227', 'ring', 89],
  ['sev', 'Sevilla', 'SEV', '#ffffff', '#d81e28', 'band', 72],
  ['fcb', 'Barcelona', 'BAR', '#a50044', '#004d98', 'stripes', 87],
  ['atm', 'Atlético Madrid', 'ATM', '#cb3524', '#ffffff', 'stripes', 82],
  ['rso', 'Real Sociedad', 'RSO', '#0067b1', '#ffffff', 'stripes', 75],
  ['vil', 'Villarreal', 'VIL', '#ffe667', '#005187', 'band', 76],
  ['int', 'Inter', 'INT', '#0a3d91', '#111111', 'stripes', 86],
  ['nap', 'Napoli', 'NAP', '#12a0d7', '#ffffff', 'ring', 82],
  ['juv', 'Juventus', 'JUV', '#f5f5f5', '#111111', 'stripes', 83],
  ['mil', 'AC Milan', 'MIL', '#d11f2f', '#111111', 'stripes', 82],
  ['rom', 'Roma', 'ROM', '#8e1f2f', '#f0bc42', 'split', 78],
  ['laz', 'Lazio', 'LAZ', '#87d8f7', '#ffffff', 'band', 77],
  ['fcbay', 'Bayern Munich', 'FCB', '#dc052d', '#0066b2', 'ring', 90],
  ['b04', 'Bayer Leverkusen', 'B04', '#e32221', '#111111', 'split', 84],
  ['bvb', 'Borussia Dortmund', 'BVB', '#fde100', '#111111', 'band', 83],
  ['rbl', 'RB Leipzig', 'RBL', '#ffffff', '#dd0741', 'chevron', 80],
  ['sge', 'Eintracht Frankfurt', 'SGE', '#e1000f', '#111111', 'split', 77],
  ['psg', 'Paris Saint-Germain', 'PSG', '#004170', '#da291c', 'band', 87],
  ['ben', 'Benfica', 'BEN', '#e83030', '#ffffff', 'ring', 80],
  ['por', 'Porto', 'POR', '#00428c', '#ffffff', 'stripes', 79],
  ['cel', 'Celtic', 'CEL', '#018749', '#ffffff', 'stripes', 74],
  ['aja', 'Ajax', 'AJA', '#d2122e', '#ffffff', 'band', 77],
  ['psv', 'PSV', 'PSV', '#ed1c24', '#ffffff', 'stripes', 79],
  ['fey', 'Feyenoord', 'FEY', '#e30613', '#111111', 'split', 77],
  // fictional non-football sides
  ['lcm', 'Lakeside Comets', 'LCM', '#ff8a3d', '#1b2a6b', 'band', 80],
  ['hrv', 'Harbour Ravens', 'HRV', '#2b2b38', '#a7b4ff', 'chevron', 78],
  ['dsh', 'Dunes Hawks', 'DSH', '#e6b54a', '#5a2a0c', 'split', 76],
  ['mtn', 'Summit Bears', 'SMB', '#3a7d44', '#f2f2f2', 'ring', 77],
  ['frz', 'Frostvale Lynx', 'FVL', '#9fd7ff', '#13324d', 'band', 79],
  ['ice', 'Glacier Bay Pike', 'GBP', '#0f6a8b', '#e5f6ff', 'chevron', 76],
  ['nv5', 'Nova Five', 'NV5', '#7b5cff', '#16e0c8', 'split', 81],
  ['iro', 'Iron Owls', 'IRO', '#8a8f98', '#ffb020', 'ring', 78],
  ['pl1', 'L. Marchetti', 'MAR', '#2f80ed', '#ffffff', 'player', 82],
  ['pl2', 'D. Okoye-Brandt', 'OKB', '#eb5757', '#ffffff', 'player', 79],
  ['pl3', 'R. Valtonen', 'VAL', '#27ae60', '#ffffff', 'player', 78],
  ['pl4', 'S. Ibarra-Kell', 'IBK', '#f2994a', '#ffffff', 'player', 80],
];
const NICK = { bha: 'Brighton', mun: 'Man Utd', mci: 'Man City', tot: 'Spurs', new: 'Newcastle', avl: 'Aston Villa', whu: 'West Ham', psg: 'PSG', b04: 'Leverkusen', bvb: 'Dortmund', sge: 'Frankfurt', atm: 'Atlético', rso: 'Sociedad', fcbay: 'Bayern', rma: 'Real Madrid', lcm: 'Comets', hrv: 'Ravens', dsh: 'Hawks', mtn: 'Bears', frz: 'Lynx', ice: 'Pike', pl1: 'Marchetti', pl2: 'Okoye-Brandt', pl3: 'Valtonen', pl4: 'Ibarra-Kell', nv5: 'Nova Five', iro: 'Iron Owls' };
export const TEAMS = Object.fromEntries(
  T.map(([id, name, short, a, b, pattern, str]) => [id, { id, name, short, nick: NICK[id] || name, a, b, pattern, str }]),
);

// Invented surnames for goalscorer markets. Not real players.
const FIRST = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'J.', 'K.', 'L.', 'M.', 'N.', 'O.', 'R.', 'S.', 'T.', 'Y.'];
const LAST = ['Varnell', 'Osei-Lowe', 'Castellan', 'Dovra', 'Quillon', 'Marrowby', 'Tessaro', 'Albane', 'Rivett', 'Kesterby',
  'Lindqvar', 'Moreau-Pike', 'Halbrook', 'Ferrante', 'Ndiaye-Ross', 'Okwuosa', 'Brannick', 'Severin', 'Takamori', 'Ulloa-Grey',
  'Westerholt', 'Zabrecki', 'Pellow', 'Amadi-Voss', 'Corrigan', 'Esterhaus', 'Gallow', 'Iñárritu-Bell', 'Jovanek', 'Lusardi'];
export function squad(teamId) {
  const r = rng('sq' + teamId);
  const out = [];
  while (out.length < 6) {
    const n = FIRST[Math.floor(r() * FIRST.length)] + ' ' + LAST[Math.floor(r() * LAST.length)];
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

const NOW = Date.now();
const MIN = 60000;
const at = (mins) => NOW + mins * MIN; // kickoff relative to page load

// live: clockStart = seconds already played at load; score
function m(id, sp, compId, h, a, opts) {
  return { id, sport: sp, comp: compId, home: h, away: a, ...opts };
}
export const MATCHES = [
  // ---- Live football
  m('ars-bha', 'football', 'epl', 'ars', 'bha', { live: true, clock: 52 * 60 + 8, score: [1, 0], featured: true }),
  m('che-new', 'football', 'epl', 'che', 'new', { live: true, clock: 17 * 60 + 40, score: [0, 0] }),
  m('rma-sev', 'football', 'lal', 'rma', 'sev', { live: true, clock: 67 * 60 + 31, score: [2, 1] }),
  m('int-nap', 'football', 'sea', 'int', 'nap', { live: true, clock: 23 * 60 + 2, score: [0, 1] }),
  m('fcbay-b04', 'football', 'bun', 'fcbay', 'b04', { live: true, clock: 81 * 60 + 15, score: [3, 2] }),
  m('psg-ben', 'football', 'ucl', 'psg', 'ben', { live: true, clock: 38 * 60 + 50, score: [1, 1] }),
  m('aja-psv', 'football', 'ere', 'aja', 'psv', { live: true, clock: 9 * 60 + 12, score: [0, 0] }),
  // ---- Live other sports
  m('pl1-pl2', 'tennis', 'atp', 'pl1', 'pl2', { live: true, sets: [[6, 4], [3, 2]], points: ['30', '15'] }),
  m('pl3-pl4', 'tennis', 'wta', 'pl3', 'pl4', { live: true, sets: [[5, 7], [2, 1]], points: ['40', 'AD'] }),
  m('lcm-hrv', 'basketball', 'nbl', 'lcm', 'hrv', { live: true, quarter: 3, qclock: 5 * 60 + 12, score: [71, 66] }),
  m('frz-ice', 'icehockey', 'ihl', 'frz', 'ice', { live: true, period: 2, pclock: 8 * 60 + 40, score: [2, 1] }),
  m('nv5-iro', 'esports', 'cs2', 'nv5', 'iro', { live: true, mapNo: 2, rounds: [9, 7], maps: [1, 0] }),
  // ---- Starting soon / upcoming football
  m('liv-mun', 'football', 'epl', 'liv', 'mun', { start: at(18), featured: true }),
  m('mci-tot', 'football', 'epl', 'mci', 'tot', { start: at(48) }),
  m('avl-whu', 'football', 'epl', 'avl', 'whu', { start: at(24 * 60 + 30) }),
  m('ars-int', 'football', 'ucl', 'ars', 'int', { start: at(2 * 24 * 60 + 200) }),
  m('fcb-por', 'football', 'ucl', 'fcb', 'por', { start: at(75) }),
  m('rma-cel', 'football', 'ucl', 'rma', 'cel', { start: at(2 * 24 * 60 + 200) }),
  m('fcbay-juv', 'football', 'ucl', 'fcbay', 'juv', { start: at(24 * 60 + 200) }),
  m('atm-rso', 'football', 'lal', 'atm', 'rso', { start: at(35) }),
  m('fcb-vil', 'football', 'lal', 'fcb', 'vil', { start: at(24 * 60 + 90) }),
  m('mil-rom', 'football', 'sea', 'mil', 'rom', { start: at(62) }),
  m('juv-laz', 'football', 'sea', 'juv', 'laz', { start: at(24 * 60 + 150) }),
  m('bvb-rbl', 'football', 'bun', 'bvb', 'rbl', { start: at(95) }),
  m('sge-b04', 'football', 'bun', 'sge', 'b04', { start: at(24 * 60 + 60) }),
  m('fey-aja', 'football', 'ere', 'fey', 'aja', { start: at(24 * 60 + 30) }),
  m('pl2-pl3', 'tennis', 'atp', 'pl2', 'pl3', { start: at(40) }),
  m('dsh-mtn', 'basketball', 'nbl', 'dsh', 'mtn', { start: at(55) }),
  m('iro-nv5', 'esports', 'cs2', 'iro', 'nv5', { start: at(120) }),
];
export const match = (id) => MATCHES.find((x) => x.id === id);
export const isThreeWay = (mt) => mt.sport === 'football' || mt.sport === 'icehockey';

export const SEED_BETS = [
  { id: 'HB-48213', matchId: 'rma-sev', market: 'Match result', pick: 'Real Madrid', odds: 1.62, stake: 20, placed: NOW - 50 * MIN, status: 'open', selId: 'rma-sev|mr|0' },
  { id: 'HB-48207', matchId: 'int-nap', market: 'Total goals · Over/Under 2.5', pick: 'Over 2.5', odds: 2.05, stake: 10, placed: NOW - 30 * MIN, status: 'open', selId: 'int-nap|tg25|0' },
  { id: 'HB-47950', matchId: null, event: 'Newcastle United v Aston Villa', market: 'Match result', pick: 'Newcastle United', odds: 2.4, stake: 15, placed: NOW - 26 * 60 * MIN, status: 'won', ret: 36 },
  { id: 'HB-47911', matchId: null, event: 'Lazio v Roma', market: 'Both teams to score', pick: 'No', odds: 2.1, stake: 10, placed: NOW - 27 * 60 * MIN, status: 'lost', ret: 0 },
  { id: 'HB-47860', matchId: null, event: 'Celtic v Porto', market: 'Total goals · Over/Under 2.5', pick: 'Over 2.5', odds: 1.85, stake: 25, placed: NOW - 50 * 60 * MIN, status: 'cashed', ret: 31.4 },
];
