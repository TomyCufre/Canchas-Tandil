// Aplica el tema guardado antes de que React renderice (evita el parpadeo).
(function () {
  try {
    var k = 'canchas-tandil-tema';
    var t = localStorage.getItem(k);
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0c1322' : '#faf8ff');
  } catch (e) { /* sin localStorage: queda el tema claro */ }
})();
