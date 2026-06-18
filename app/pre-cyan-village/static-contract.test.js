const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const runtimeFiles = [
  'index.html',
  'styles.css',
  'village-data.js',
  'village-state.js',
  'village-render.js'
];

const sources = Object.fromEntries(
  runtimeFiles.map((file) => [
    file,
    fs.readFileSync(path.join(root, file), 'utf8')
  ])
);

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function source(file) {
  return sources[file];
}

test('token and Cyan loop hosts exist', () => {
  assert.match(source('index.html'), /id="player-token"/);
  assert.match(source('index.html'), /id="cyan-loop"/);
  assert.match(source('village-render.js'), /data-cyan-choice/);
});

test('movement locking and fallback are wired', () => {
  assert.match(source('index.html'), /aria-busy="false"/);
  assert.match(source('village-render.js'), /setAttribute\('aria-busy'/);
  assert.match(source('village-render.js'), /MOVE_FALLBACK_MS/);
  assert.match(source('village-render.js'), /transitionend/);
  assert.match(source('village-render.js'), /completingMove/);
});

test('banned first-experience strings are absent from runtime files only', () => {
  assert.deepEqual(runtimeFiles, [
    'index.html',
    'styles.css',
    'village-data.js',
    'village-state.js',
    'village-render.js'
  ]);
  assert.equal(runtimeFiles.some((file) => file.endsWith('.test.js')), false);

  const bannedStrings = [
    '필수 기초 단어 놀이터',
    '이해함',
    '점수',
    '학습 완료'
  ];

  runtimeFiles.forEach((file) => {
    bannedStrings.forEach((banned) => {
      assert.equal(
        source(file).includes(banned),
        false,
        `${file} must not include banned first-experience string: ${banned}`
      );
    });
  });
});
