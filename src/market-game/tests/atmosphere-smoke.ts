import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Browser } from 'playwright';
import { STORAGE_KEY } from '../storage';
import { TIME_CONSENT_KEY } from '../atmosphere';

export async function atmosphereSmoke(browser: Browser, url: string, artifacts: string): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1402, height: 1122 }, timezoneId: 'Asia/Seoul', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(request.url()));
  try {
    await page.clock.install({ time: new Date('2026-09-10T12:00:00+09:00') });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${artifacts}/30-daylight-desktop.png` });
    await page.locator('.scene').screenshot({ path: `${artifacts}/30-ink-scene.png` });
    assert.equal(await page.locator('html').getAttribute('data-light'), 'day');
    await page.clock.setSystemTime(new Date('2026-09-10T22:00:00+09:00'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    assert.equal(await page.locator('html').getAttribute('data-light'), 'day', '동의 전에는 밤에도 낮을 유지합니다.');
    await page.locator('#background-settings').click();
    assert.equal(await page.locator('#time-consent').isChecked(), false);
    await page.locator('#time-consent').check();
    assert.equal(await page.locator('html').getAttribute('data-light'), 'night');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-light'), 'night', '동의는 새로고침 후 유지합니다.');
    const storedBefore = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
    const sceneBefore = await page.locator('.scene-art').getAttribute('src');
    const prepare = await page.locator('#quantity').inputValue();

    for (const [hour, mode, name] of [[6, 'twilight', 'dawn'], [9, 'day', 'morning'], [19, 'twilight', 'sunset'], [22, 'night', 'night']] as const) {
      await page.clock.setSystemTime(new Date(`2026-09-10T${String(hour).padStart(2, '0')}:00:00+09:00`));
      // 다른 탭에서 돌아오면 현재 시각의 외관을 바로 반영합니다.
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      assert.equal(await page.locator('html').getAttribute('data-light'), mode);
      assert.equal(await page.locator('#quantity').inputValue(), prepare);
      assert.equal(await page.locator('.scene-art').getAttribute('src'), sceneBefore);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY), storedBefore);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${artifacts}/31-${name}-desktop.png` });
    }

    // 분 경계에서 화면 전체를 다시 그리거나 선택·초점을 바꾸지 않습니다.
    await page.clock.setSystemTime(new Date('2026-09-10T18:59:30+09:00'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.locator('#quantity').focus();
    const nightBefore = await page.locator('html').evaluate(el => el.style.getPropertyValue('--night'));
    await page.clock.fastForward(60_000);
    assert.notEqual(await page.locator('html').evaluate(el => el.style.getPropertyValue('--night')), nightBefore);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'quantity');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY), storedBefore);

    await page.setViewportSize({ width: 390, height: 844 });
    for (const [hour, name] of [[12, 'daylight'], [22, 'night']] as const) {
      await page.clock.setSystemTime(new Date(`2026-09-10T${hour}:00:00+09:00`));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('.web-atmosphere').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
      await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: `${artifacts}/32-${name}-mobile.png`, fullPage: true });
    }
    await page.locator('#open-market').click();
    await page.locator('#skip-sales').click();
    assert.equal((await page.locator('#wallet-value').innerText()).replace(/[^0-9]/g, ''), '27000');
    await page.locator('#help').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#help').evaluate(el => el === document.activeElement), true);
    await page.locator('#background-settings').click();
    await page.locator('#time-consent').uncheck();
    assert.equal(await page.locator('html').getAttribute('data-light'), 'day');
    await page.screenshot({ path: `${artifacts}/35-time-consent-mobile.png` });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-light'), 'day', '동의 철회도 유지합니다.');
    await page.evaluate(key => localStorage.setItem(key, 'invalid'), TIME_CONSENT_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-light'), 'day', '손상된 설정은 낮으로 초기화합니다.');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }

  // 같은 UTC 시각이라도 기기에 설정한 현지 시각을 따릅니다.
  for (const blockedStorage of [false, true]) {
    const alternate = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/New_York', reducedMotion: 'reduce' });
    const tab = await alternate.newPage();
    try {
      if (blockedStorage) await tab.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new Error('저장소 접근 불가'); } });
      });
      await tab.clock.install({ time: new Date('2026-09-10T22:00:00+09:00') });
      await tab.goto(url, { waitUntil: 'networkidle' });
      assert.equal(await tab.locator('html').getAttribute('data-light'), 'day');
      await tab.locator('#background-settings').click();
      await tab.locator('#time-consent').check();
      assert.equal(await tab.locator('html').getAttribute('data-light'), 'day', '한국 22시, 뉴욕 09시에는 낮입니다.');
      await tab.clock.setSystemTime(new Date('2026-09-11T02:00:00Z'));
      await tab.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      assert.equal(await tab.locator('html').getAttribute('data-light'), 'night');
      await tab.reload({ waitUntil: 'networkidle' });
      assert.equal(await tab.locator('html').getAttribute('data-light'), blockedStorage ? 'day' : 'night');
      if (!blockedStorage) {
        await tab.locator('#background-settings').click();
        const otherTab = await alternate.newPage();
        await otherTab.goto(url, { waitUntil: 'networkidle' });
        await otherTab.evaluate(key => localStorage.setItem(key, 'disabled'), TIME_CONSENT_KEY);
        await tab.waitForFunction(() => document.documentElement.dataset.light === 'day');
        assert.equal(await tab.locator('#time-consent').isChecked(), false, '다른 탭에서 철회하면 열린 동의 창도 반영합니다.');
      }
    } finally { await alternate.close(); }
  }

  // 로컬 기준 시안이 있는 환경에서만 비교판을 남깁니다. 제품에는 포함되지 않습니다.
  const source = process.env.MARKET_DESIGN_REFERENCE;
  if (source) {
    const comparison = await browser.newPage({ viewport: { width: 2804, height: 1122 } });
    try {
      const toData = async (path: string) => `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
      await comparison.setContent(`<style>body{margin:0;display:flex}img{display:block;width:1402px;height:1122px;object-fit:contain}</style><img src="${await toData(source)}"><img src="${await toData(`${artifacts}/30-daylight-desktop.png`)}">`);
      await comparison.locator('img').evaluateAll(images => Promise.all(images.map(img => (img as HTMLImageElement).decode())));
      await comparison.screenshot({ path: `${artifacts}/33-daylight-comparison.png` });
      await comparison.setViewportSize({ width: 1600, height: 340 });
      await comparison.addStyleTag({ content: 'body{gap:0}img{width:1402px;height:1122px;object-fit:none;object-position:left top}img:first-child{margin-right:-602px}img:last-child{position:absolute;left:800px}' });
      await comparison.screenshot({ path: `${artifacts}/34-header-comparison.png` });
      const nightReference = process.env.MARKET_NIGHT_REFERENCE;
      if (nightReference) {
        await comparison.setViewportSize({ width: 2804, height: 1122 });
        await comparison.setContent(`<style>body{margin:0;display:flex}img{display:block;width:1402px;height:1122px;object-fit:contain}</style><img src="${await toData(nightReference)}"><img src="${await toData(`${artifacts}/31-night-desktop.png`)}">`);
        await comparison.locator('img').evaluateAll(images => Promise.all(images.map(img => (img as HTMLImageElement).decode())));
        await comparison.screenshot({ path: `${artifacts}/36-night-comparison.png` });
      }
      const inkReference = process.env.MARKET_INK_REFERENCE;
      if (inkReference) {
        await comparison.setViewportSize({ width: 1600, height: 650 });
        await comparison.setContent(`<style>body{margin:0;display:flex;align-items:center;background:white}img{display:block;width:800px;height:650px;object-fit:contain}</style><img src="${await toData(inkReference)}"><img src="${await toData(`${artifacts}/30-ink-scene.png`)}">`);
        await comparison.locator('img').evaluateAll(images => Promise.all(images.map(img => (img as HTMLImageElement).decode())));
        await comparison.screenshot({ path: `${artifacts}/37-ink-comparison.png` });
      }
    } finally { await comparison.close(); }
  }
  console.log('시간 동의·철회·저장 불가 / 서울·뉴욕 현지 시각 / 낮·새벽·저녁·밤 / 게임 진행·초점 유지 / 모바일·야간 조작: 통과');
}
