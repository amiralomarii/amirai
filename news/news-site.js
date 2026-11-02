(() => {
  'use strict';
  // A section destination on another page is stored only for the next navigation;
  // it is never appended to the visitor's address bar.
  document.querySelectorAll('a[data-home-section]').forEach(link => {
    link.addEventListener('click', () => {
      try { sessionStorage.setItem('amir-site-destination',link.dataset.homeSection); } catch (_) {}
    });
  });
  // file:// is a convenient backup preview. Clean folder routes are preserved on
  // the real GitHub Pages host and on the included local server.
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(a => {
      const href=a.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return;
      if (href.endsWith('/'))a.setAttribute('href',href+'index.html');
    });
  }
})();
