# Rallyd website and app share links

This is the GitHub Pages source for **https://rallyd.app/** in
`carlpaddleapp-coder/rallyd-landing`. Pages publishes `main`, repository root.
Keep `CNAME` unchanged. No host migration, DNS change or Cloudflare configuration
is part of this change.

## What the share-link files do

- `.nojekyll` is already present and must stay: it lets Pages serve `.well-known`.
- `.well-known/apple-app-site-association` associates `/m/*` and `/g/*` with
  **`2DAQJ9Y8RF.app.rallyd.ios`**. It has no filename extension.
- `.well-known/assetlinks.json` associates **`app.rallyd.android`** with the
  approved release and debug SHA-256 certificates. These are public certificate
  fingerprints, not signing keys. If Play App Signing is adopted, separately
  review/add its app-signing certificate before relying on Play-installed links.
- `404.html` is Pages' fallback for missing paths. Only `/m/{id}` and `/g/{id}`
  (single letters/digits/underscore/hyphen ID, optional trailing slash) show the
  **Open in Rallyd** button, correct App Store link and Android private-tester
  note. Other paths show a normal not-found page. The HTTP status remains 404;
  this is a client-side fallback, not a rewrite or redirect.

The button uses `rallyd://m/{id}` or `rallyd://g/{id}` and copies the original
`location.hash` unchanged. Claim/invite fragments stay on the client, are never
rendered, and are handed only to the installed app when the user taps. There is
no automatic navigation, analytics, third-party script/resource, match/group data
fetch or data rendering. The browser sends the path, not the `#fragment`, to
Pages. The page also disables referrers and network connections with a CSP.
Never put claim credentials in query strings, analytics, screenshots or logs.
These files do not implement or release the future claim-all app/backend feature.

## Local validation

No dependencies, SDKs or app builds are needed:

```sh
node --test tests/share-links.test.mjs
git diff --check
```

Tests cover identities/signers, valid/invalid routes, retained claim/invite
fragments, no automatic navigation or network calls, and the safe default page.
They are not physical-device acceptance or proof of Apple's CDN approval.

## Publish (Carl)

**Merge the PR into `main` in this repository.** That is the publish step:
GitHub Pages then builds/deploys the root automatically. Wait for the Pages
deployment to succeed in GitHub's Actions/Deployments view before checking live.
Do not merge an unrelated Rallyd app PR to publish the site. No separate hosting
account, DNS change or manual deployment command is needed.

This PR is deliberately left unmerged. Live validators and the iPhone tap test
below are **NOT RUN** against this change until Carl publishes it.

## Verify after publishing

### 1. Public files and fallback

Request these exact HTTPS URLs without following redirects:

```sh
curl -I https://rallyd.app/.well-known/apple-app-site-association
curl -I https://rallyd.app/.well-known/assetlinks.json
```

Both association files must return **200 without a 301/302**. Read their bodies
and compare with the repository files: the Apple identity/paths and both Android
fingerprints must match. Android's `.json` file should serve as `application/json`.

**Accepted GitHub Pages limitation:** the extensionless Apple file may serve as
`application/octet-stream`, not `application/json`. Carl explicitly chose to
retain Pages and test Apple's CDN/device handling. This is not a promise that
the MIME type will be accepted; file availability and valid JSON alone do not
prove working Universal Links. Do not add a `_headers` file pretending Pages
supports custom response headers.

Open `/m/link-check-only` and `/g/link-check-only` in a browser: expect the branded
Open in Rallyd fallback (HTTP 404), with no score/player data. `/unknown-page`
must show Page not found with no app-open button. Use only artificial fragments
when inspecting the fallback; never paste real claim/invite credentials into a
validator, terminal, screenshot or shared diagnostic report.

### 2. Apple AASA validator and CDN

Use Apple's built-in AASA validator on a Mac, as documented in
[TN3155: Debugging universal links](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links):

```sh
sudo swcutil dl -d rallyd.app
sudo swcutil verify -d rallyd.app -j .well-known/apple-app-site-association -u https://rallyd.app/m/link-check-only
sudo swcutil verify -d rallyd.app -j .well-known/apple-app-site-association -u https://rallyd.app/g/link-check-only
```

The local-file checks must report the current App ID and matching patterns.
Check the file actually cached by Apple separately at
`https://app-site-association.cdn-apple.com/a/v1/rallyd.app`: it must contain the
new App ID and both paths, not the old `com.carlblack.Rallyd` entry. CDN/device
caches can lag a site update; there is no instant CDN invalidation. Do not treat
the local syntax validator as a substitute for the live CDN and iPhone checks.

### 3. Google Digital Asset Links tester

Use Google's
[Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator).
Test `https://rallyd.app` against package `app.rallyd.android` with each fingerprint
in `.well-known/assetlinks.json`, relation `delegate_permission/common.handle_all_urls`.
Both must validate. Use no match links or fragments in this tester. Website
association is only one half of App Links; the installed Android build must also
declare the matching verified intent filters and signing certificate.

### 4. Real-iPhone tap test (Carl, required)

1. On an iPhone with the intended Rallyd build installed (1.2 (20)), paste
   `https://rallyd.app/m/link-check-only` and
   `https://rallyd.app/g/link-check-only` into **Notes** or a message.
2. Long-press each link. Expect an option to open in Rallyd; choose it, then tap
   again to check normal handling. The match link should reach the shared-match
   screen and the group link the group flow. These artificial IDs may correctly
   show missing content; do not create, claim or join anything for this check.
3. Test an existing published match link you are authorised to view if you need
   to distinguish routing from missing content. Do not redeem a claim invitation
   just to test the website.
4. In Safari, deliberately view a web fallback and confirm its button opens
   Rallyd. Also check an unknown path has no Open in Rallyd button. This custom
   scheme test is separate from Universal Links: it must not mask their failure.

Typing a URL into Safari's address bar is **not** a Universal Link tap test;
Apple documents that it stays in the browser. Record build, iOS version, date and
pass/fail for both routes, with no claim/invite credentials in the evidence.

If the CDN check or the real-iPhone test still fails after accounting for caches
and the device's open-in-browser preference, report it before calling links live.
**Cloudflare Pages is the fallback only after a failed test and a later explicit
decision.** No migration or Cloudflare preparation is included here.
