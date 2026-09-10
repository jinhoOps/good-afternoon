import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, type Page } from 'playwright';
import { STORAGE_KEY } from '../storage';
import { journeySmoke } from './journey-smoke';
import { atmosphereSmoke } from './atmosphere-smoke';
import { creditsEasterSmoke } from './credits-easter-smoke';

const url = process.env.MARKET_TEST_URL ?? 'http://127.0.0.1:4173/good-afternoon/';
const artifactDir = process.env.MARKET_SCREENSHOTS ?? '/tmp/good-afternoon-market-qa';

async function noOverflow(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(size.scroll <= size.width, `가로 넘침: ${JSON.stringify(size)}`);
}

async function cash(page: Page): Promise<number> {
  return Number((await page.locator('#wallet-value').innerText()).replace(/[^0-9]/g, ''));
}

async function setQuantity(page: Page, quantity: number): Promise<void> {
  await page.locator('#quantity').fill(String(quantity));
  await page.locator('#quantity').press('Tab');
}

async function sell(page: Page): Promise<void> {
  await page.locator('#open-market').click();
  await page.locator('#skip-sales').click();
  await page.locator('#next-day').waitFor();
}

async function main(): Promise<void> {
  await mkdir(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors: string[] = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', (request) => {
      const reason = request.failure()?.errorText;
      // 감사 창을 닫으며 영상을 해제하면 진행 중인 미디어 요청은 정상 취소됩니다.
      // 실제 재생·디코딩은 이스터에그 검사에서 확인하며 다른 요청 실패는 계속 보고합니다.
      if (request.resourceType() === 'media' && /\/assets\/good-afternoon-[^/]+\.mp4$/.test(request.url()) && reason === 'net::ERR_ABORTED') return;
      errors.push(`${request.url()}: ${reason}`);
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('#open-market').waitFor();
    assert.equal(await cash(page), 18000);
    assert.equal(await page.locator('.scene-art').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), true);
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/01-desktop-preparation.png`, fullPage: true });

    await page.locator('#help').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').count(), 0);
    assert.equal(await page.locator('#help').evaluate((el) => el === document.activeElement), true);

    await page.locator('#restart').click();
    assert.equal(await page.locator('#confirm-reset').isVisible(), true);
    assert.equal(await page.locator('.credits-dialog').count(), 0);
    await page.keyboard.press('Escape');

    // 실제 플레이처럼 입력창에서 곧바로 누른 첫 클릭도 처리합니다.
    await page.locator('#quantity').fill('8');
    await page.locator('#open-market').click();
    assert.equal(await page.locator('#skip-sales').count(), 1);
    await page.locator('#skip-sales').click();
    assert.equal(await cash(page), 24000);
    await page.locator('#retry-day').click();
    await page.locator('#quantity').fill('9');
    await page.locator('#help').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#quantity').inputValue(), '9');
    assert.equal(await page.locator('#help').evaluate(el => el === document.activeElement), true);

    // 입력 확정으로 버튼이 재생성돼도 Tab의 이동 방향과 비활성 건너뛰기를 유지합니다.
    await page.locator('#quantity').fill('8');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'more');
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#quantity').inputValue(), '9');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'quantity');
    await page.locator('#quantity').fill('12');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'preset-4');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'quantity');
    await page.locator('#quantity').fill('0');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'restart');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'quantity');
    await page.locator('#quantity').fill('');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#quantity').inputValue(), '0');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'more');

    await setQuantity(page, 10);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#quantity').inputValue(), '10');
    await sell(page);
    assert.equal(await cash(page), 21000);
    await page.screenshot({ path: `${artifactDir}/02-desktop-result.png`, fullPage: true });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 21000);
    assert.equal(await page.locator('#next-day').isVisible(), true);
    await page.locator('#retry-day').click();
    assert.equal(await cash(page), 18000);
    await setQuantity(page, 6);
    await sell(page);
    assert.equal(await cash(page), 27000);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#next-day').click();
    await page.locator('#price-3600').click();
    await setQuantity(page, 12);
    await noOverflow(page);
    assert.equal(await page.locator('.dream').isVisible(), true);
    await page.screenshot({ path: `${artifactDir}/03-mobile-preparation.png`, fullPage: true });
    for (const selector of ['#more', '#less', '#price-3600', '#open-market']) {
      const bounds = await page.locator(selector).boundingBox();
      assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44, `${selector} 터치 영역 확인`);
    }
    await sell(page);
    assert.equal(await cash(page), 34200);
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/04-mobile-result.png`, fullPage: true });

    for (const [quantity, price] of [[4, 2400], [8, 3600], [14, 3600]]) {
      await page.locator('#next-day').click();
      await setQuantity(page, quantity);
      await page.locator(`#price-${price}`).click();
      await sell(page);
      await noOverflow(page);
    }
    await page.locator('#next-day').click();
    await page.locator('#new-market').waitFor();
    assert.equal(await cash(page), 56400);
    assert.equal(await page.locator('.day-history li').count(), 5);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 56400);
    await page.screenshot({ path: `${artifactDir}/05-mobile-finale.png`, fullPage: true });
    await page.locator('#final-journal').click();
    assert.equal(await page.locator('.journal-entry').count(), 5);
    await noOverflow(page);
    await page.locator('#close-modal').click();

    const completedSave = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    await page.locator('#new-market').click();
    assert.ok((await page.locator('#credits-title').innerText()).includes('고맙습니다'));
    assert.ok((await page.locator('#credits-summary').innerText()).includes('같은 날씨와 손님'));
    assert.equal(await page.locator('#credits-motion').getAttribute('aria-pressed'), 'false');
    const replayBounds = await page.locator('#replay-market').boundingBox();
    assert.ok(replayBounds && replayBounds.y >= 0 && replayBounds.y + replayBounds.height <= 844);
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/11-mobile-thanks.png` });
    await page.locator('#credits-scroll').focus();
    await page.locator('#credits-scroll').press('End');
    await page.waitForFunction(() => {
      const viewport = document.querySelector('#credits-scroll')!;
      return viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2;
    });
    await page.screenshot({ path: `${artifactDir}/12-mobile-thanks-end.png` });
    await page.locator('.credits-return').click();
    assert.equal(await cash(page), 56400);
    assert.equal(await page.locator('#new-market').evaluate((el) => el === document.activeElement), true);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), completedSave);
    await page.locator('#new-market').click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 56400);
    assert.equal(await page.locator('.credits-dialog').count(), 0);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#new-market').click();
    assert.equal(await page.locator('#credits-motion').getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `${artifactDir}/13-desktop-thanks.png` });
    await page.waitForFunction(() => document.querySelector('#credits-scroll')!.scrollTop > 8);
    await page.locator('#credits-motion').click();
    const stoppedAt = await page.locator('#credits-scroll').evaluate(el => el.scrollTop);
    await page.waitForTimeout(180);
    assert.equal(await page.locator('#credits-scroll').evaluate(el => el.scrollTop), stoppedAt);
    await page.locator('#credits-motion').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('#credits-motion')?.getAttribute('aria-pressed') === 'false');
    assert.equal(await page.locator('#credits-motion').getAttribute('aria-pressed'), 'false');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY), completedSave);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#new-market').click();
    await page.locator('#replay-market').click();
    assert.equal(await cash(page), 18000);
    assert.equal(await page.locator('.credits-dialog').count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await page.locator('#open-market').click();
    // 영업 애니메이션 중 새로고침해도 한 번 정산한 결과만 복구합니다.
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 27000);
    assert.equal(await page.locator('#next-day').isVisible(), true);

    await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 18000);
    assert.ok((await page.locator('.notice').innerText()).includes('새 장터'));

    // 일반 속도에서도 손님·재고·현금이 함께 변하고 영업이 스스로 끝나야 합니다.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#open-market').click();
    assert.equal(await cash(page), 9000);
    await page.locator('.customer-bubble').waitFor();
    assert.equal(await cash(page), 12000);
    assert.equal((await page.locator('.counter-caption strong').innerText()).replace(/\s/g, ''), '5잔');
    const customerBounds = await page.locator('.customer-bubble').boundingBox();
    assert.ok(customerBounds && customerBounds.y >= 0 && customerBounds.y + customerBounds.height <= 844, '모바일에서 손님 반응이 현재 화면 안에 보여야 합니다.');
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/06-mobile-selling.png` });
    await page.locator('#next-day').waitFor();
    assert.equal(await cash(page), 27000);

    // 기존 버전의 셋째 날 저장에서 이어 시작해 보관과 다음 날 판매를 확인합니다.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({
      version: 1, phase: 'planning', order: { quantity: 6, price: 1200 },
      receipts: [{ quantity: 6, price: 1000 }, { quantity: 8, price: 1200 }]
    })), STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 40200);
    assert.ok((await page.locator('.notice').innerText()).includes('진행은 그대로'));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await setQuantity(page, 9);
    await page.locator('#price-2400').click();
    await page.locator('#rent-cooler').click();
    assert.equal(await page.locator('#rent-cooler').getAttribute('aria-pressed'), 'true');
    assert.ok((await page.locator('.tomorrow-news').innerText()).includes('2,100원'));
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#rent-cooler').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#quantity').inputValue(), '9');
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/07-desktop-cooler.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    const rentalBounds = await page.locator('#rent-cooler').boundingBox();
    assert.ok(rentalBounds && rentalBounds.height >= 44);
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/08-mobile-cooler.png`, fullPage: true });
    await sell(page);
    assert.equal(await cash(page), 36900);
    assert.ok((await page.locator('.cooler-prop').innerText()).includes('4잔'));
    assert.ok((await page.locator('.storage-result').innerText()).includes('4잔'));
    await page.locator('.inventory-accounting summary').click();
    assert.ok((await page.locator('.accounting-profit').innerText()).includes('2,700원'));
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/09-mobile-stored-result.png`, fullPage: true });
    await page.locator('#next-day').click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#quantity').inputValue(), '2');
    assert.ok((await page.locator('.carried-stock').innerText()).includes('4잔'));
    assert.equal(await page.locator('#rent-cooler').getAttribute('aria-pressed'), 'false');
    await setQuantity(page, 3);
    await page.locator('#price-3600').click();
    await page.screenshot({ path: `${artifactDir}/10-mobile-next-day-stock.png`, fullPage: true });
    await sell(page);
    assert.equal(await cash(page), 55800);
    await page.locator('#retry-day').click();
    assert.equal(await cash(page), 36900);
    assert.ok((await page.locator('.carried-stock').innerText()).includes('4잔'));
    await setQuantity(page, 0);
    await page.locator('#price-4500').click();
    await page.locator('#rent-cooler').click();
    assert.equal(await page.locator('#open-market').innerText(), '가게 문 열기');
    await page.locator('#open-market').click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 44100);
    assert.ok((await page.locator('.storage-result').innerText()).includes('2잔'));
    await page.locator('#next-day').click();
    assert.equal(await page.locator('.carried-stock').count(), 0);
    assert.equal(await page.locator('#rent-cooler').count(), 0);

    const failedStorage = await context.newPage();
    await failedStorage.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('저장소 접근 불가'); } });
    });
    await failedStorage.goto(url, { waitUntil: 'networkidle' });
    await sell(failedStorage);
    assert.equal(await cash(failedStorage), 27000);
    assert.ok((await failedStorage.locator('.notice').innerText()).includes('남기지 못했어요'));

    await journeySmoke(page, completedSave!, artifactDir);
    await creditsEasterSmoke(page, completedSave!, artifactDir);
    assert.deepEqual(errors, [], `브라우저 오류: ${errors.join('\n')}`);
    await context.close();
    await atmosphereSmoke(browser, url, artifactDir);
    console.log('PC·390×844 모바일 / 5일 진행 / 감사 스크롤·재시작·기록 보존 / 보관·기한 / v1 저장 이전·손상·접근 실패 / 콘솔·이미지·넘침: 통과');
    console.log(`화면 캡처: ${artifactDir}`);
    console.log('공원 두 주간 완주 / 목표 성장·설비·새 메뉴 / 선불 주문·납품·품절 / 장터 이동·최고 기록 유지: 통과');
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
