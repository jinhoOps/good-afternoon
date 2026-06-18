import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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

test('Vite entry keeps token and Cyan loop hosts wired', () => {
  const indexHtml = readVillageFile('index.html');

  assert.ok(indexHtml.includes('id="player-token"'));
  assert.ok(indexHtml.includes('id="cyan-loop"'));
  assert.match(indexHtml, /<script[^>]*\btype="module"[^>]*\bsrc="\.\/main\.ts"[^>]*><\/script>/);
});

test('movement locking and fallback remain wired', () => {
  const indexHtml = readVillageFile('index.html');
  const renderSource = readVillageFile(join('view', 'render.ts'));
  const eventsSource = readVillageFile(join('view', 'events.ts'));

  assert.ok(indexHtml.includes('aria-busy="false"'));
  assert.match(renderSource, /setAttribute\('aria-busy'/);
  assert.match(eventsSource, /\bMOVE_FALLBACK_MS\b/);
  assert.match(eventsSource, /addEventListener\('transitionend'/);
  assert.match(eventsSource, /\bcompletingMove\b/);
});

test('last move path supports reverse matching and direct fallback rendering', () => {
  const movementSource = readVillageFile(join('domain', 'movement.ts'));
  const boardViewSource = readVillageFile(join('view', 'board-view.ts'));

  assert.match(movementSource, /\bisSamePath\b/);
  assert.match(boardViewSource, /\bis-last-move-direct\b/);
});

test('runtime source avoids banned first-experience strings', () => {
  const bannedStrings = ['필수 기초 단어 놀이터', '이해함', '점수', '학습 완료'];
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
