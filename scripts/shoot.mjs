import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173/housebets-sportsbook-v2/';
const OUT = process.env.OUT || '/workspace/sportsbook/shots-v2';
const tag = process.env.TAG || 'local';
const pages = [['1-home', '#/'], ['2-live', '#/live'], ['3-football', '#/football'], ['4-match', '#/match/ars-bha'], ['5-betslip', '#/betslip']];
const vps = [['desktop', { width: 1440, height: 900 }, 1, false], ['phone', { width: 390, height: 844 }, 2, true]];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const report = [];
for (const [vn, vp, dpr, mobile] of vps) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  await page.goto(BASE + '#/');
  await page.evaluate(() => localStorage.clear());
  for (const [name, hash] of pages) {
    await page.goto(BASE + hash);
    await page.waitForTimeout(700);
    if (name === '5-betslip') {
      await page.click('#main [data-act="sample"] >> visible=true');
      await page.waitForTimeout(400);
    }
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    await page.screenshot({ path: `${OUT}/${tag}-${vn}-${name}.png` });
    // full-length capture: grow the viewport to the page height so sticky/fixed shell parts sit where they really are
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: vp.width, height: Math.min(h, 6000) });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${tag}-${vn}-${name}-full.png` });
    await page.setViewportSize(vp);
    report.push({ vn, name, overflow: ov.sw > ov.cw, ...ov });
  }
  report.push({ vn, errors: errs });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
