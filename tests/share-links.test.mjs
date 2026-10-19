import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function render(pathname, hash = '') {
  const elements = Object.fromEntries(['open-app', 'title', 'subtitle'].map(id => [id, { hidden: true, textContent: '', href: '' }]));
  const context = {
    window: { location: { pathname, hash } },
    document: { getElementById: id => elements[id] }
  };
  // No fetch, storage, analytics, timers or automatic navigation are available.
  vm.runInNewContext(read('share/open.js'), context);
  return { elements, context };
}
test('Apple association contains the current verified app and both share routes', () => {
  const file = JSON.parse(read('.well-known/apple-app-site-association'));
  const app = file.applinks.details.find(d => d.appID === '2DAQJ9Y8RF.app.rallyd.ios');
  assert.deepEqual(app.paths, ['/m/*', '/g/*']);
});
test('Android association contains both exact release and debug certificates', () => {
  const [statement] = JSON.parse(read('.well-known/assetlinks.json'));
  assert.deepEqual(statement.relation, ['delegate_permission/common.handle_all_urls']);
  assert.equal(statement.target.namespace, 'android_app');
  assert.equal(statement.target.package_name, 'app.rallyd.android');
  assert.deepEqual(statement.target.sha256_cert_fingerprints.map(s => s.replaceAll(':', '').toLowerCase()), [
    'dbd21c822041fe69e3fe273ef7c2db6293138edf95cecd564159ef624c8f6453',
    'dd3167cb4369b7914352efd7fb388a39dca80ed0d0ccb63d666dc4a818a2be7d'
  ]);
});
for (const kind of ['m', 'g']) {
  test(`${kind} passes the original fragment only to the explicit app link`, () => {
    const hash = '#claim=TEST%2Ftoken%2Bvalue&name=%E2%9C%93';
    const { elements, context } = render(`/${kind}/abc-123_X`, hash);
    assert.equal(elements['open-app'].href, `rallyd://${kind}/abc-123_X${hash}`);
    assert.equal(elements['open-app'].hidden, false);
    assert.equal(context.window.location.hash, hash);
    assert.ok(Object.values(elements).every(el => !el.textContent.includes('TEST')));
  });
}
test('no-fragment, trailing slash and legacy links remain usable', () => {
  for (const kind of ['m', 'g', 'match', 'invite', 'profile']) {
    assert.equal(render(`/${kind}/abc/`).elements['open-app'].href, `rallyd://${kind}/abc`);
  }
});
test('invalid and hostile paths never become app links', () => {
  for (const path of ['/', '/m/', '/g/a/b', '/m/%2Fetc', '/m/<script>', '//evil.test/m/a', '/no/a']) {
    const { elements } = render(path, '#private');
    assert.equal(elements['open-app'].hidden, true);
    assert.equal(elements['open-app'].href, '');
    assert.equal(elements.title.textContent, 'Link not recognised');
  }
});
test('fallback and GitHub 404 use only local assets and a verified token-free store link', () => {
  const html = read('share/index.html');
  assert.equal(read('404.html'), html);
  assert.match(html, /https:\/\/apps.apple.com\/app\/rallyd-racket-sports\/id6777384063/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /Android testers/);
  assert.doesNotMatch(html, /https?:\/\/(?!apps.apple.com)/);
  assert.match(html, /id="open-app"[^>]*hidden/);
});
test('host config serves JSON and rewrites new routes without redirecting', () => {
  const config = read('netlify.toml');
  for (const route of ['/m/*', '/g/*']) {
    assert.ok(config.includes(`from = "${route}"\n  to = "/share/index.html"\n  status = 200`));
  }
  for (const path of ['apple-app-site-association', 'assetlinks.json']) {
    assert.ok(config.includes(`for = "/.well-known/${path}"\n  [headers.values]\n    Content-Type = "application/json"`));
  }
  assert.match(config, /connect-src 'none'/);
});
