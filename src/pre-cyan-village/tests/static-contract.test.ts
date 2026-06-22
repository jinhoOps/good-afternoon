import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const rootDir = process.cwd();
const villageDir = join(rootDir, 'src', 'pre-cyan-village');

function readProjectFile(path: string): string {
  return readFileSync(join(rootDir, path), 'utf8');
}

function readVillageFile(path: string): string {
  return readFileSync(join(villageDir, path), 'utf8');
}

function listRuntimeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'tests' ? [] : listRuntimeFiles(fullPath);
    }
    return /\.(html|ts|css)$/.test(entry.name) ? [fullPath] : [];
  });
}

function hasViteEntryScript(indexHtml: string): boolean {
  const scriptTags = indexHtml.match(/<script\b[^>]*><\/script>/g) ?? [];
  return scriptTags.some((tag) => {
    return /\btype\s*=\s*["']module["']/.test(tag)
      && /\bsrc\s*=\s*["']\.\/main\.ts["']/.test(tag);
  });
}

test('Vite entry exposes only the Phaser shell host', () => {
  const indexHtml = readVillageFile('index.html');
  const domOnlyHostIds = [
    'room-screen',
    'guide-line',
    'start-outing',
    'village-board',
    'outing-title',
    'outing-slots',
    'zone-board',
    'village-log-text',
    'reaction-panel',
    'reaction-text',
    'status-strip',
    'reset-state'
  ];

  assert.ok(indexHtml.includes('id="phaser-shell"'));
  assert.ok(indexHtml.includes('id="phaser-game"'));
  assert.ok(indexHtml.includes('data-runtime="phaser"'));
  for (const hostId of domOnlyHostIds) {
    assert.equal(indexHtml.includes(`id="${hostId}"`), false, hostId);
  }
  assert.equal(hasViteEntryScript(indexHtml), true);
});

test('Vite entry declares a project-local favicon', () => {
  const indexHtml = readVillageFile('index.html');

  assert.match(indexHtml, /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\.\/favicon\.svg">/);
  assert.equal(existsSync(join(villageDir, 'favicon.svg')), true);
});

test('Vite entry starts Phaser without runtime migration branching', () => {
  const indexHtml = readVillageFile('index.html');
  const mainSource = readVillageFile('main.ts');

  assert.ok(indexHtml.includes('id="phaser-game"'));
  assert.ok(indexHtml.includes('id="phaser-shell"'));
  assert.ok(indexHtml.includes('data-runtime="phaser"'));
  assert.match(mainSource, /dataset\.runtime\s*=\s*['"]phaser['"]/);
  assert.match(mainSource, /startPreCyanGame/);
  assert.doesNotMatch(mainSource, /URLSearchParams/);
  assert.doesNotMatch(mainSource, /runtimeSearch/);
  assert.doesNotMatch(mainSource, /wireEvents/);
  assert.doesNotMatch(mainSource, /queryAppElements|renderApp/);
});

test('Phaser prototype SVG assets exist in the Vite source tree', () => {
  const assetNames = [
    'player.svg',
    'room.svg',
    'bank.svg',
    'store.svg',
    'bus-stop.svg',
    'board.svg',
    'lottery.svg',
    'dark-alley.svg',
    'cyan-trace.svg'
  ];

  for (const assetName of assetNames) {
    assert.equal(existsSync(join(villageDir, 'assets', assetName)), true, assetName);
  }
});

test('Phaser game scenes remain wired as the entry experience', () => {
  const mainGameSource = readVillageFile(join('game', 'main-game.ts'));

  assert.match(mainGameSource, /\bRoomScene\b/);
  assert.match(mainGameSource, /\bVillageScene\b/);
  assert.match(mainGameSource, /\bstartPreCyanGame\b/);
});

test('runtime source avoids banned first-experience strings', () => {
  const bannedStrings = [
    ['필수', ' 기초', ' 단어', ' 놀이터'].join(''),
    ['이', '해함'].join(''),
    ['점', '수'].join(''),
    ['학습', ' 완료'].join('')
  ];
  const runtimeFiles = listRuntimeFiles(villageDir);

  for (const file of runtimeFiles) {
    const source = readFileSync(file, 'utf8');
    for (const banned of bannedStrings) {
      assert.equal(
        source.includes(banned),
        false,
        `${relative(rootDir, file)} must not contain "${banned}"`
      );
    }
  }
});

test('GitHub Pages workflow deploys the Vite dist artifact', () => {
  const workflow = readProjectFile(join('.github', 'workflows', 'deploy.yml'));

  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /cache:\s*['"]?npm['"]?/);
  assert.match(workflow, /\bnpm ci\b/);
  assert.match(workflow, /\bnpm run build\b/);
  assert.match(workflow, /path:\s*['"]?\.\/dist['"]?/);
  assert.doesNotMatch(workflow, /app\/pre-cyan-village/);
});

test('Vite build uses the GitHub Pages project base path', () => {
  const viteConfig = readProjectFile('vite.config.ts');

  assert.match(viteConfig, /base:\s*['"]\/good-afternoon\/['"]/);
});

test('repository docs point developers at Vite commands and generated dist output', () => {
  const gitignore = readProjectFile('.gitignore');
  const readme = readProjectFile('README.md');

  assert.match(gitignore, /^dist\/$/m);
  assert.match(readme, /npm run dev/);
  assert.match(readme, /npm run build/);
  assert.match(readme, /npm run preview/);
  assert.doesNotMatch(readme, /app\/pre-cyan-village\/index\.html/);
  assert.doesNotMatch(readme, /index\.html`?을 .*직접/);
});
