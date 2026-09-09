import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium, type Page } from 'playwright';
import { STORAGE_KEY } from '../storage';

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
    page.on('requestfailed', (request) => errors.push(request.url()));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('#open-market').waitFor();
    assert.equal(await cash(page), 6000);
    assert.equal(await page.locator('.scene-art').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), true);
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/01-desktop-preparation.png`, fullPage: true });

    await page.locator('#help').click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').count(), 0);
    assert.equal(await page.locator('#help').evaluate((el) => el === document.activeElement), true);

    await setQuantity(page, 10);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#quantity').inputValue(), '10');
    await sell(page);
    assert.equal(await cash(page), 7000);
    await page.screenshot({ path: `${artifactDir}/02-desktop-result.png`, fullPage: true });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 7000);
    assert.equal(await page.locator('#next-day').isVisible(), true);
    await page.locator('#retry-day').click();
    assert.equal(await cash(page), 6000);
    await setQuantity(page, 6);
    await sell(page);
    assert.equal(await cash(page), 9000);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#next-day').click();
    await page.locator('#price-1200').click();
    await setQuantity(page, 12);
    await noOverflow(page);
    assert.equal(await page.locator('.dream').isVisible(), true);
    await page.screenshot({ path: `${artifactDir}/03-mobile-preparation.png`, fullPage: true });
    for (const selector of ['#more', '#less', '#price-1200', '#open-market']) {
      const bounds = await page.locator(selector).boundingBox();
      assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44, `${selector} 터치 영역 확인`);
    }
    await sell(page);
    assert.equal(await cash(page), 11400);
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/04-mobile-result.png`, fullPage: true });

    for (const [quantity, price] of [[4, 800], [8, 1200], [14, 1200]]) {
      await page.locator('#next-day').click();
      await setQuantity(page, quantity);
      await page.locator(`#price-${price}`).click();
      await sell(page);
      await noOverflow(page);
    }
    await page.locator('#next-day').click();
    await page.locator('#new-market').waitFor();
    assert.equal(await cash(page), 18800);
    assert.equal(await page.locator('.day-history li').count(), 5);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 18800);
    await page.screenshot({ path: `${artifactDir}/05-mobile-finale.png`, fullPage: true });
    await page.locator('#final-journal').click();
    assert.equal(await page.locator('.journal-entry').count(), 5);
    await noOverflow(page);
    await page.locator('#close-modal').click();

    await page.locator('#new-market').click();
    await page.locator('#confirm-reset').click();
    assert.equal(await cash(page), 6000);
    await page.locator('#open-market').click();
    // 영업 애니메이션 중 새로고침해도 한 번 정산한 결과만 복구합니다.
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 9000);
    assert.equal(await page.locator('#next-day').isVisible(), true);

    await page.evaluate((key) => localStorage.setItem(key, '{broken'), STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await cash(page), 6000);
    assert.ok((await page.locator('.notice').innerText()).includes('새 장터'));

    // 일반 속도에서도 손님·재고·현금이 함께 변하고 영업이 스스로 끝나야 합니다.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#open-market').click();
    assert.equal(await cash(page), 3000);
    await page.locator('.customer-bubble').waitFor();
    assert.equal(await cash(page), 4000);
    assert.equal((await page.locator('.counter-caption strong').innerText()).replace(/\s/g, ''), '5잔');
    const customerBounds = await page.locator('.customer-bubble').boundingBox();
    assert.ok(customerBounds && customerBounds.y >= 0 && customerBounds.y + customerBounds.height <= 844, '모바일에서 손님 반응이 현재 화면 안에 보여야 합니다.');
    await noOverflow(page);
    await page.screenshot({ path: `${artifactDir}/06-mobile-selling.png` });
    await page.locator('#next-day').waitFor();
    assert.equal(await cash(page), 9000);

    const failedStorage = await context.newPage();
    await failedStorage.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('저장소 접근 불가'); } });
    });
    await failedStorage.goto(url, { waitUntil: 'networkidle' });
    await sell(failedStorage);
    assert.equal(await cash(failedStorage), 9000);
    assert.ok((await failedStorage.locator('.notice').innerText()).includes('남기지 못했어요'));

    assert.deepEqual(errors, [], `브라우저 오류: ${errors.join('\n')}`);
    await context.close();
    console.log('PC·390×844 모바일 / 5일 전체 진행 / 다시 해보기 / 저장·손상·접근 실패 / 콘솔·이미지·넘침: 통과');
    console.log(`화면 캡처: ${artifactDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
