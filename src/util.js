export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (n) => nf2.format(n);
export const usdt = (n) => `${nf2.format(n)}&nbsp;USDT`;
export const fOdds = (v) => (v == null ? '–' : v.toFixed(2));
const tf = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const df = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const time = (t) => tf.format(t);
export function dayLabel(t) {
  const d = new Date(t), n = new Date();
  const k = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((k(d) - k(n)) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return df.format(d);
}
export function startsIn(t) {
  const m = Math.round((t - Date.now()) / 60000);
  if (m <= 0) return 'Starting now';
  if (m < 60) return `In ${m} min`;
  return `${dayLabel(t)} ${time(t)}`;
}
export function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return dayLabel(t) === 'Today' ? time(t) : `${df.format(t)}, ${time(t)}`;
}
export function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, q: new URLSearchParams(qs || ''), path };
}
