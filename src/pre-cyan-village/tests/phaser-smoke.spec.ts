import { chromium } from 'playwright';

declare const process: {
  exit(code?: number): never;
};

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const failed: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('requestfailed', (request) => {
      failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('http://127.0.0.1:4173/good-afternoon/', {
      waitUntil: 'networkidle',
      timeout: 30_000
    });

    await page.waitForSelector('#phaser-game canvas', { timeout: 10_000 });

    const result = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#phaser-game canvas');
      const rect = canvas?.getBoundingClientRect();

      return {
        canvasExists: Boolean(canvas),
        canvasHeight: canvas?.height ?? 0,
        canvasWidth: canvas?.width ?? 0,
        domStartButtonExists: document.getElementById(['start', 'outing'].join('-')) !== null,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        rectHeight: rect?.height ?? 0,
        rectWidth: rect?.width ?? 0,
        runtime: document.documentElement.dataset.runtime
      };
    });

    const hasCanvasSize =
      (result.canvasWidth > 0 && result.canvasHeight > 0) ||
      (result.rectWidth > 0 && result.rectHeight > 0);

    if (!result.canvasExists) {
      throw new Error('Phaser canvas missing');
    }
    if (!hasCanvasSize) {
      throw new Error(`Phaser canvas has invalid size ${JSON.stringify(result)}`);
    }
    if (result.runtime !== 'phaser') {
      throw new Error(`Unexpected runtime ${result.runtime}`);
    }
    if (result.domStartButtonExists) {
      throw new Error('DOM runtime start button should not exist in Phaser entry');
    }
    if (result.overflow > 0) {
      throw new Error(`Mobile horizontal overflow ${result.overflow}`);
    }
    if (failed.length > 0) {
      throw new Error(`Failed requests: ${failed.join(', ')}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors: ${consoleErrors.join(', ')}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`Page errors: ${pageErrors.join(', ')}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
