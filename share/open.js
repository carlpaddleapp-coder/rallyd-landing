/* No network requests, tracking, storage or automatic redirects on share pages. */
(function () {
  'use strict';
  var route = window.location.pathname.match(/^\/(m|g|match|invite|profile)\/([A-Za-z0-9_-]+)\/?$/);
  var button = document.getElementById('open-app');
  if (!route) {
    document.getElementById('title').textContent = 'Link not recognised';
    document.getElementById('subtitle').textContent = 'Ask the sender for a fresh Rallyd link.';
    return;
  }
  // The fragment may contain a claim token. Preserve it verbatim only in the
  // custom-scheme link. Never copy it into text, an HTTP URL, a log or analytics.
  button.href = 'rallyd://' + route[1] + '/' + route[2] + window.location.hash;
  button.hidden = false;
})();
