import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('release entrypoint uses versioned runtime assets so stale service workers cannot serve old UI', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /styles\.css\?v=1\.2\.0/);
  assert.match(html, /src\/app\.js\?v=1\.2\.0/);
  assert.match(html, /manifest\.webmanifest\?v=1\.2\.0/);
});

test('service worker fetches navigation from the network before offline cache fallback', async () => {
  const worker = await readFile(new URL('sw.js', root), 'utf8');
  assert.match(worker, /request\.mode === 'navigate'/);
  const navigationBranch = worker.slice(worker.indexOf("request.mode === 'navigate'"));
  assert.ok(navigationBranch.indexOf('fetch(event.request)') < navigationBranch.indexOf("caches.match('./index.html')"));
});
