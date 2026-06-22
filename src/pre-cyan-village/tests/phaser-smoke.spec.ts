import { chromium } from 'playwright';

async function main(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const failed: string[] = [];
    const consoleErrors: string[] = [];

    page.on('requestfailed', (request) => {
      failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.goto('http://127.0.0.1:4173/good-afternoon/?runtime=phaser', {
      waitUntil: 'networkidle',
      timeout: 30_000
    });

    await page.waitForSelector('#phaser-game canvas', { timeout: 10_000 });

    const result = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#phaser-game canvas');
      const rect = canvas?.getBoundingClientRect();
      const appShell = document.querySelector<HTMLElement>('.app-shell');
      const appShellStyle = appShell ? window.getComputedStyle(appShell) : null;

      return {
        appShellHidden: appShell
          ? appShell.hidden || appShellStyle?.display === 'none' || appShellStyle?.visibility === 'hidden'
          : true,
        canvasExists: Boolean(canvas),
        canvasHeight: canvas?.height ?? 0,
        canvasWidth: canvas?.width ?? 0,
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
    if (!result.appShellHidden) {
      throw new Error('DOM app shell is visible during Phaser runtime');
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
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  throw error;
});
