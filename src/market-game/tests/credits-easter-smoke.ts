import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { STORAGE_KEY } from '../storage';

export async function creditsEasterSmoke(page: Page, completedSave: string, artifacts: string): Promise<void> {
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: STORAGE_KEY, raw: completedSave });
  await page.reload({ waitUntil: 'networkidle' });
  const video = page.locator('#credits-easter-video');
  const end = async () => {
    await page.locator('#credits-scroll').focus();
    await page.locator('#credits-scroll').press('End');
    await page.waitForFunction(() => document.querySelector<HTMLVideoElement>('#credits-easter-video')!.readyState >= 2);
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#new-market').click();
  assert.equal(await page.locator('#credits-easter-egg').isVisible(), false);
  assert.equal(await video.getAttribute('src'), null, '감사 화면을 열기만 해서는 영상을 요청하지 않습니다.');
  await end();
  assert.equal(await page.locator('#credits-easter-egg').isVisible(), true);
  assert.equal(await video.evaluate((el: HTMLVideoElement) => el.paused), true, '동작 감소 설정은 자동 재생하지 않습니다.');
  const bounds = await video.boundingBox();
  const viewport = await page.locator('#credits-scroll').boundingBox();
  assert.ok(bounds && viewport && bounds.y >= viewport.y && bounds.y + bounds.height <= viewport.y + viewport.height);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: `${artifacts}/40-mobile-easter-egg.png` });
  await page.locator('#credits-easter-motion').click();
  await page.waitForFunction(() => document.querySelector<HTMLVideoElement>('#credits-easter-video')!.currentTime > 0.1);
  await page.locator('#credits-scroll').focus();
  await page.locator('#credits-scroll').press('Home');
  await page.waitForFunction(() => document.querySelector<HTMLVideoElement>('#credits-easter-video')!.paused);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY), completedSave);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#new-market').click();
  assert.equal(await video.getAttribute('src'), null, '다시 열면 이스터에그도 숨긴 상태로 시작합니다.');
  await end();
  await page.waitForFunction(() => {
    const media = document.querySelector<HTMLVideoElement>('#credits-easter-video')!;
    return !media.paused && media.currentTime > 0.1;
  });
  assert.equal(await video.evaluate((el: HTMLVideoElement) => el.muted && el.playsInline), true);
  assert.equal(await page.locator('#credits-easter-motion').getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: `${artifacts}/41-desktop-easter-egg.png` });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector<HTMLVideoElement>('#credits-easter-video')!.paused);
  await page.locator('#credits-motion').click();
  assert.equal(await page.locator('#credits-easter-egg').isVisible(), false);
  assert.equal(await video.getAttribute('src'), null);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY), completedSave);
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  console.log('감사 끝 이스터에그 / 늦은 로딩·자동 재생 / 동작 감소·일시정지 / 재진입·기록 보존: 통과');
}
