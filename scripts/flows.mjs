import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173/housebets-sportsbook-v2/';
const OUT = process.env.OUT || '/workspace/sportsbook/shots-v2';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const errs = [];
async function mk(vp, dpr, mobile) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  await page.goto(BASE + '#/'); await page.evaluate(() => localStorage.clear()); await page.reload();
  return page;
}
async function tall(p, n) { const vp = p.viewportSize(); const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: vp.width, height: Math.min(h, 6000) }); await p.waitForTimeout(250); await shot(p, n); await p.setViewportSize(vp); }
const shot = (p, n) => p.screenshot({ path: `${OUT}/state-${n}.png` });
const demo = async (p, sel) => { await p.click('[data-open="demo"] >> visible=true'); await p.waitForTimeout(150); await p.click(sel); await p.waitForTimeout(300); };
const closeDemo = async (p) => { const d = await p.$('#dlg-demo[open]'); if (d) await p.keyboard.press('Escape'); await p.waitForTimeout(150); };
const step = async (name, fn) => { try { await fn(); } catch (e) { errs.push(`flow ${name}: ${e.message.split('\n')[0]}`); } };

let p = await mk({ width: 1440, height: 900 }, 1, false);
await step('slip', async () => {
  await p.goto(BASE + '#/match/ars-bha'); await p.waitForTimeout(400);
  await p.click('.pin [data-market="ars-bha|mr"] .pc >> nth=0');
  await p.click('.mlist [data-market="ars-bha|btts"] .pc >> nth=0');
  await p.click('.side [data-key="1"]'); await p.click('.side [data-key="5"]');
  await p.click('.side [data-stake] >> nth=0'); await p.click('.side [data-key="+10"]');
  await p.waitForTimeout(300); await shot(p, 'd-slip-keypad');
});
await step('odds', async () => { await demo(p, '[data-demo-act="odds"]'); await closeDemo(p); await p.waitForTimeout(200); await shot(p, 'd-odds-changed'); await p.click('.side [data-act="accept"]'); await p.waitForTimeout(200); });
await step('susp-sel', async () => { await demo(p, '[data-demo-act="suspend-sel"]'); await closeDemo(p); await shot(p, 'd-selection-suspended'); await demo(p, '[data-demo-act="suspend-sel"]'); await closeDemo(p); });
await step('fail', async () => {
  await p.click('[data-open="demo"] >> visible=true'); await p.check('[data-demo="failNext"]', { force: true }); await closeDemo(p);
  const acc = await p.$('.side [data-act="accept"]'); if (acc) await acc.click();
  await p.click('.side [data-act="place"]'); await p.waitForTimeout(250); await shot(p, 'd-placing');
  await p.waitForTimeout(1400); await shot(p, 'd-bet-failed');
});
await step('placed', async () => {
  const acc = await p.$('.side [data-act="accept"]'); if (acc) await acc.click();
  await p.click('.side [data-act="place"]'); await p.waitForTimeout(1600); await shot(p, 'd-bet-placed-receipt');
});
await step('cashout', async () => {
  await p.click('.side [data-act="view-bets"]'); await p.waitForTimeout(200);
  await p.click('.side [data-cash] >> nth=0'); await p.waitForTimeout(150); await shot(p, 'd-cashout-confirm');
  await p.click('.side [data-cash-yes]'); await p.waitForTimeout(300); await p.click('.side [data-btab="settled"]'); await p.waitForTimeout(200); await shot(p, 'd-mybets-settled');
});
await step('match-susp', async () => { await demo(p, '[data-demo-act="suspend-match"]'); await closeDemo(p); await p.waitForTimeout(300); await shot(p, 'd-match-suspended'); await demo(p, '[data-demo-act="suspend-match"]'); await closeDemo(p); });
await step('groups', async () => {
  await p.goto(BASE + '#/match/ars-bha?g=Goalscorers'); await p.waitForTimeout(300); await shot(p, 'd-match-goalscorers');
  await p.goto(BASE + '#/match/ars-bha'); await p.waitForTimeout(300); await p.fill('[data-mq]', 'corner'); await p.waitForTimeout(300); await shot(p, 'd-match-market-search');
  await p.fill('[data-mq]', ''); await p.click('[data-collapse-all]'); await p.waitForTimeout(200); await shot(p, 'd-match-collapsed');
  await p.click('[data-collapse-all]'); await p.waitForTimeout(4500); await shot(p, 'd-match-odds-moving');
  await p.mouse.wheel(0, 900); await p.waitForTimeout(400); await shot(p, 'd-match-pinned-bar');
});
await step('search', async () => {
  await p.goto(BASE + '#/'); await p.waitForTimeout(300);
  await p.fill('#q-top', 'bri'); await p.waitForTimeout(200); await shot(p, 'd-search');
  await p.fill('#q-top', 'corners'); await p.waitForTimeout(200); await shot(p, 'd-search-markets');
  await p.fill('#q-top', 'zzzq'); await p.waitForTimeout(200); await shot(p, 'd-search-none'); await p.fill('#q-top', ''); await p.keyboard.press('Escape');
});
await step('follow', async () => {
  await p.goto(BASE + '#/football?league=lal'); await p.waitForTimeout(500);
  await p.click('[data-follow="comps:lal"] >> visible=true'); await p.waitForTimeout(200);
  await p.click('#tf-lal summary'); await p.click('[data-follow="teams:rso"]'); await p.waitForTimeout(200); await shot(p, 'd-football-follow');
  await p.goto(BASE + '#/football?show=following'); await p.waitForTimeout(300); await shot(p, 'd-football-following');
  await p.goto(BASE + '#/'); await p.waitForTimeout(300); await p.mouse.wheel(0, 1400); await p.waitForTimeout(300); await shot(p, 'd-home-favourites');
});
await step('demo', async () => {
  await p.goto(BASE + '#/'); await p.click('[data-open="demo"] >> visible=true'); await p.waitForTimeout(200); await shot(p, 'd-demo-panel');
  await p.check('[data-demo="nothingLive"]', { force: true }); await closeDemo(p);
  await p.goto(BASE + '#/live'); await p.waitForTimeout(300); await shot(p, 'd-nothing-live');
  await p.goto(BASE + '#/'); await p.waitForTimeout(300); await shot(p, 'd-home-nothing-live');
  await p.click('[data-open="demo"] >> visible=true'); await p.uncheck('[data-demo="nothingLive"]', { force: true }); await closeDemo(p);
  await p.goto(BASE + '#/live?sport=football'); await p.waitForTimeout(300); await shot(p, 'd-live-filter-football');
  await p.goto(BASE + '#/betslip'); await p.waitForTimeout(300); await tall(p, 'd-betslip-page');
});
await p.context().close();

p = await mk({ width: 390, height: 844 }, 2, true);
await step('p-bar', async () => {
  await p.goto(BASE + '#/match/ars-bha'); await p.waitForTimeout(400);
  await p.tap('.pin [data-market="ars-bha|mr"] .pc >> nth=0'); await p.waitForTimeout(500); await shot(p, 'p-bar-1');
  await p.tap('.mlist [data-market="ars-bha|btts"] .pc >> nth=0'); await p.waitForTimeout(200);
  await p.tap('[data-mbar] a'); await p.waitForTimeout(400);
  await p.tap('#main [data-key="2"]'); await p.tap('#main [data-key="0"]'); await p.waitForTimeout(200); await shot(p, 'p-betslip-keypad');
  await tall(p, 'p-betslip-full');
});
await step('p-odds', async () => { await demo(p, '[data-demo-act="odds"]'); await closeDemo(p); await p.waitForTimeout(300); await shot(p, 'p-odds-changed'); });
await step('p-place', async () => {
  const acc = await p.$('#main [data-act="accept"]'); if (acc) await acc.tap();
  await p.tap('#main [data-act="place"]'); await p.waitForTimeout(1600); await shot(p, 'p-receipt');
});
await step('p-misc', async () => {
  await p.goto(BASE + '#/live'); await p.waitForTimeout(300); await shot(p, 'p-live');
  await p.goto(BASE + '#/football'); await p.waitForTimeout(300); await shot(p, 'p-football');
  await p.tap('[data-open="menu"] >> visible=true'); await p.waitForTimeout(300); await shot(p, 'p-menu'); await p.keyboard.press('Escape');
  await p.tap('.bnav [data-open="search"]'); await p.waitForTimeout(200); await p.fill('#q-ov', 'ars'); await p.waitForTimeout(200); await shot(p, 'p-search'); await p.keyboard.press('Escape');
  await p.goto(BASE + '#/betslip'); await p.waitForTimeout(300); await p.tap('#main [data-ptab="bets"]'); await p.waitForTimeout(200); await tall(p, 'p-mybets');
});
await browser.close();
console.log('errors:', JSON.stringify(errs));
