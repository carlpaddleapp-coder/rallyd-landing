import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const release = 'DB:D2:1C:82:20:41:FE:69:E3:FE:27:3E:F7:C2:DB:62:93:13:8E:DF:95:CE:CD:56:41:59:EF:62:4C:8F:64:53';
const debug = 'DD:31:67:CB:43:69:B7:91:43:52:EF:D7:FB:38:8A:39:DC:A8:0E:D0:D0:CC:B6:3D:66:6D:C4:A8:18:A2:BE:7D';

test('Pages serves dot files without Jekyll filtering', () => {
  assert.ok(existsSync(new URL('.nojekyll', root)));
  assert.equal(read('CNAME').trim(), 'rallyd.app');
});

test('AASA has only the current iPhone identity and match/group paths', () => {
  assert.deepEqual(JSON.parse(read('.well-known/apple-app-site-association')), {
    applinks: { apps: [], details: [{ appID: '2DAQJ9Y8RF.app.rallyd.ios', paths: ['/m/*', '/g/*'] }] },
  });
});

test('Android association contains the exact release and debug signers', () => {
  assert.deepEqual(JSON.parse(read('.well-known/assetlinks.json')), [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: 'app.rallyd.android',
      sha256_cert_fingerprints: [release, debug] },
  }]);
});

function render(pathname, hash = '', search = '') {
  const html = read('404.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, 'one local inline script');
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, {
    hidden: new RegExp(`id="${id}"[^>]*\\bhidden\\b`).test(html),
    textContent: '', href: undefined,
  }]));
  const noNetwork = () => { throw new Error('Fallback must not use network or automatic navigation'); };
  const location = Object.freeze({ pathname, hash, search });
  runInNewContext(scripts[0][1], {
    window: Object.freeze({ location }),
    document: { title: '', getElementById: id => {
      assert.ok(elements.has(id), `known element: ${id}`);
      return elements.get(id);
    } },
    fetch: noNetwork, XMLHttpRequest: noNetwork, WebSocket: noNetwork,
    setTimeout: noNetwork, setInterval: noNetwork,
  });
  return { html, elements };
}

for (const [name, pathname, hash, expected] of [
  ['match', '/m/example-match', '', 'rallyd://m/example-match'],
  ['group', '/g/example-group', '', 'rallyd://g/example-group'],
  ['guest claim fragment', '/m/example-match', '#claim=example-only', 'rallyd://m/example-match#claim=example-only'],
  ['invite-all fragment', '/m/example-match', '#invite=example-only', 'rallyd://m/example-match#invite=example-only'],
  ['group fragment', '/g/example-group', '#invite=example-only', 'rallyd://g/example-group#invite=example-only'],
  ['encoded fragment', '/m/example-match', '#claim=example%2Bonly%3D&x=%23', 'rallyd://m/example-match#claim=example%2Bonly%3D&x=%23'],
  ['trailing slash', '/g/example-group/', '', 'rallyd://g/example-group'],
]) {
  test(`fallback opens ${name} and preserves the original fragment`, () => {
    const { elements } = render(pathname, hash, '?ignored=example');
    assert.equal(elements.get('link-actions').hidden, false);
    assert.equal(elements.get('open-app').href, expected);
    assert.ok(![...elements.values()].some(el => el.textContent.includes('example-only')));
  });
}

test('unknown and unsafe paths stay a normal not-found page, even with fragments', () => {
  for (const path of ['/', '/other', '/m/', '/g/', '/m/id/extra', '/match/id', '/invite/id',
    '/profile/id', '/m/%2Fattack', '/g/%22onclick%3Dattack', '/m/../id', '//m/id']) {
    const { elements } = render(path, '#claim=example-only');
    assert.equal(elements.get('link-actions').hidden, true, path);
    assert.equal(elements.get('open-app').href, undefined, path);
  }
});

test('fallback has no third-party resources, data fetches, redirects or HTML injection', () => {
  const html = read('404.html');
  assert.match(html, /id="link-actions" hidden/);
  assert.match(html, /<h1 id="title">Page not found<\/h1>/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /https:\/\/apps\.apple\.com\/app\/id6777384063/);
  assert.match(html, /Android.*test/i);
  assert.doesNotMatch(html, /<(?:script|img|iframe|link)\b[^>]*(?:src|href)=/i);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|innerHTML|document\.write|location\.(?:href|assign|replace)\s*(?:=|\()/i);
});

test('README records publication, Apple/Google validation and the physical iPhone gate', () => {
  const readme = read('README.md');
  for (const phrase of ['Merge the PR', 'application/octet-stream', 'swcutil verify',
    'digital-asset-links/tools/generator', 'Notes', 'Cloudflare Pages', 'NOT RUN']) {
    assert.ok(readme.includes(phrase), phrase);
  }
});
