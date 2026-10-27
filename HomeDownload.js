// Download guidance only. No account lookup, link credentials or network requests.
(function () {
  var android = /Android/i.test(navigator.userAgent || '');
  var hero = document.getElementById('hero-download');
  var store = document.getElementById('store-download');
  hero.href = android ? '#download' : ShareLinkStrings.appStoreURL;
  hero.textContent = android ? ShareLinkStrings.androidButton : ShareLinkStrings.appStoreButton;
  store.href = ShareLinkStrings.appStoreURL;
  store.textContent = ShareLinkStrings.appStoreButton;
  store.hidden = android;
  document.getElementById('download-title').textContent = android
    ? ShareLinkStrings.androidTitle : ShareLinkStrings.availableTitle;
  document.getElementById('download-description').textContent = android
    ? ShareLinkStrings.androidHomeInstructions : ShareLinkStrings.availableDescription;
  document.getElementById('android-availability').textContent = ShareLinkStrings.androidAvailability;
})();
