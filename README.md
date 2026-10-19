# Rallyd website and share links

## Which repository is live?

As checked on **19 October 2026**, `carlpaddleapp-coder/rallyd-landing` serves
**https://rallyd.app** from GitHub Pages (`main`, repository root).
`gh api repos/carlpaddleapp-coder/rallyd-landing/pages` reports `cname: rallyd.app`;
`Rallydapp/rallyd-site` reports no custom domain. The latter is the old site.

The live AASA currently returns `application/octet-stream`. GitHub Pages cannot
apply `netlify.toml` or custom response headers; its `404.html` fallback also
returns HTTP 404. **Merging this PR into the existing Pages site alone does not
finish Universal/App Links hosting.** This repo includes a prepared Netlify
configuration for JSON response headers and HTTP 200 internal rewrites. No host,
DNS, account, or deployment was changed while preparing it.

## Link behaviour

- `/m/{id}` and `/g/{id}` serve the same small fallback page. IDs are one
  alphanumeric/underscore/hyphen segment (including UUIDs); trailing slash works.
- “Open in Rallyd” opens `rallyd://m/{id}` or `rallyd://g/{id}` only on a tap.
  Existing `/match/`, `/invite/`, `/profile/` fallback links still work.
- The original `#fragment` is copied verbatim **only into that custom-scheme
  link**. No fetch, analytics, storage, timer, auto-open, match lookup, third-party
  asset, or token display is used. Query parameters are not copied. A fragment is
  browser-only and is not part of an HTTP request. Never change a claim fragment
  into a query parameter or add analytics/snippet injection to these pages.
- The App Store button is a fixed URL with no token. Verified via Apple's lookup
  for `app.rallyd.ios`: **Rallyd Racket Sports**, Rallyd Ltd, ID **6777384063**.
  Android testers are directed to the APK Carl supplies; no Play listing is invented.
- AASA includes `2DAQJ9Y8RF.app.rallyd.ios` with `/m/*` and `/g/*`. Team ID checked
  read-only against Rallyd's `docs/Accounts.md`. The old app's association and
  webcredentials are retained for existing users, not silently removed.
- Asset Links includes `app.rallyd.android` with both Carl-supplied SHA-256
  fingerprints, also matching the live/debug pack evidence in Rallyd's
  `docs/Android Testing.md`. Debug trust is intentional for this tester rollout.
  Review its removal separately when debug app linking is no longer needed.

## Carl: publishing steps (manual; not performed by this PR)

1. Review this PR. **Do not merge until ready for a website publication**: GitHub
   Pages automatically publishes `main`. Keep the existing Pages site running
   while preparing the replacement.
2. In Netlify, import **`carlpaddleapp-coder/rallyd-landing`** from GitHub. For the
   first preview select this PR's branch, `feature/share-link-fallbacks`.
   Base directory: repository root. Build command: `sh scripts/prepare-site.sh`.
   Publish directory: `_site`. The checked-in `netlify.toml` sets these too.
   This is a static copy operation: no npm install, package dependencies or secrets.
   Disable any automatic script/snippet/analytics injection. Publishing this
   preview is a deliberate manual step; none was created by Codex.
3. Check the preview's landing/privacy/terms pages and run the checks below
   against its `.netlify.app` hostname. Browser fallback checks work there;
   Universal Links on real devices still require the canonical `rallyd.app` host.
4. When satisfied, merge the PR and select `main` as Netlify's production branch.
   Verify its successful deploy. Add `rallyd.app` as the **primary** custom domain
   in Netlify (do not redirect apex to `www`, which would redirect the AASA).
5. In **GoDaddy DNS** (the nameservers currently are `ns63.domaincontrol.com` and
   `ns64.domaincontrol.com`), replace only the web records using Netlify's
   **Domain management → Production domains → Pending DNS verification** values.
   For standard Netlify hosting, an apex A record is `@ → 75.2.60.5`; use the
   actual value Netlify displays if different. Replace the existing GitHub Pages
   apex A records, and any conflicting web AAAA record. If `www` is used, point
   its CNAME at the assigned Netlify hostname. **Keep email MX/TXT/DKIM/SPF and
   other unrelated records unchanged. No nameserver transfer is required.**
6. Wait for DNS propagation and Netlify HTTPS certificate provisioning. Verify
   both canonical `.well-known` URLs below are HTTP 200 JSON, with no Location
   header or redirects. Keep the old site until these checks pass; then disable
   GitHub Pages on this repository to avoid having two publication systems.
7. Check real iPhone and Android links after installing the appropriate Rallyd
   builds. The apps must already declare the domain/routes and handle the custom
   scheme; this website PR does not change app configuration. Rollback, if needed:
   restore the previously recorded web DNS values and leave the old Pages source
   intact. That restores the old site's known association limitations too.

Official references: [Netlify external DNS](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/),
[custom headers](https://docs.netlify.com/manage/routing/headers/),
[200 rewrites](https://docs.netlify.com/manage/routing/redirects/redirect-options/).

## Verification

No dependencies or installs required for local contract checks:

```sh
node --test tests/share-links.test.mjs
sh scripts/prepare-site.sh
```

The tests cover the exact app IDs/certificates, both fragment-preserving routes,
legacy routes, invalid paths, token-free store link, fallback parity, and config.
They do **not** claim Netlify or device verification. `_site` contains only public
assets; tests, README, scripts and Git files are not copied into it.

After publishing, inspect headers **without `-L`**, so redirects cannot hide:

```sh
curl -sS -D - -o /tmp/rallyd-aasa.json https://rallyd.app/.well-known/apple-app-site-association
curl -sS -D - -o /tmp/rallyd-assetlinks.json https://rallyd.app/.well-known/assetlinks.json
curl -sS -o /dev/null -w '%{http_code}\n' https://rallyd.app/m/test-match
curl -sS -o /dev/null -w '%{http_code}\n' https://rallyd.app/g/test-guest
```

Expect **200**, `Content-Type: application/json` for both association files,
no `Location`, valid JSON, and 200 for both share routes. Do not add authentication,
bot challenges, or geoblocks to `.well-known`.

**Apple's AASA validator:** use Apple's built-in `swcutil`, as documented in
[TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links).
It requires administrator access; it was not run with elevated privileges here.

```sh
sudo swcutil dl -d rallyd.app
sudo swcutil verify -d rallyd.app -j /tmp/rallyd-aasa.json -u https://rallyd.app/m/test-match
sudo swcutil verify -d rallyd.app -j /tmp/rallyd-aasa.json -u https://rallyd.app/g/test-guest
```

Expect both paths to match `2DAQJ9Y8RF.app.rallyd.ios`. On iPhone, Settings →
Developer → Universal Links → Associated Domains Development → Diagnostics
can test a URL against the installed app. Tap a link from Notes/Messages rather
than typing it into Safari. Apple's CDN caches AASA; allow refresh time or reinstall
an appropriate test build before diagnosing a stale association as a code bug.

**Google's Digital Asset Links tester:** open the
[Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator).
Use site `https://rallyd.app`, package `app.rallyd.android`, relation
`delegate_permission/common.handle_all_urls`. Test each SHA-256 in
`.well-known/assetlinks.json` separately (release and debug).

With the corresponding app installed, check on Android:

```sh
adb shell pm verify-app-links --re-verify app.rallyd.android
adb shell pm get-app-links app.rallyd.android
```

Expect `rallyd.app: verified`; allow verification time. Tap both link types from
another app. Device/OS user link preferences may also affect opening.

**Fragment privacy check:** use only a dummy value, e.g.
`https://rallyd.app/g/test-guest#claim=DUMMY%2Ftoken`.
In browser Network tools, the document request contains no fragment; only local
CSS/JS are loaded. The button destination must be
`rallyd://g/test-guest#claim=DUMMY%2Ftoken`. No match data appears, and the App Store
button must remain the fixed token-free URL. Repeat for `/m/test-match`, without
an app installed (fallback visible) and with it installed (app receives the link).
Never paste a real guest claim token into validators, logs or a bug report.
