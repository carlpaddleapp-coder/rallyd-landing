import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
const root = new URL('../', import.meta.url);
function render(userAgent = '') {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, { hidden: false, textContent: '', href: undefined }]));
  const context = { navigator: { userAgent }, document: { getElementById: id => {
    assert.ok(elements.has(id), `Home download element ${id} exists`);
    return elements.get(id);
  } } };
  for (const [, source] of html.matchAll(/<script src="(\/[^\"]+)"/g)) {
    const file = new URL(source.slice(1), root);
    if (existsSync(file)) runInNewContext(readFileSync(file, 'utf8'), context);
  }
  return elements;
}
test('home download actions send iPhone visitors to the released app', () => {
  const page = render('iPhone');
  assert.equal(page.get('hero-download')?.href, 'https://apps.apple.com/app/id6777384063');
  assert.equal(page.get('store-download')?.href, 'https://apps.apple.com/app/id6777384063');
  assert.equal(page.get('store-download')?.hidden, false);
});
test('Android visitors get private testing instructions rather than Apple installation', () => {
  const page = render('Mozilla/5.0 (Linux; Android 15)');
  assert.equal(page.get('hero-download')?.href, '#download');
  assert.equal(page.get('store-download')?.hidden, true);
  assert.match(page.get('download-description')?.textContent ?? '', /live Android tester pack/);
  assert.match(page.get('download-description')?.textContent ?? '', /original invitation/);
});
test('desktop visitors can download iPhone app and see Android availability', () => {
  const page = render();
  assert.equal(page.get('store-download')?.href, 'https://apps.apple.com/app/id6777384063');
  assert.match(page.get('android-availability')?.textContent ?? '', /private testing/);
});
