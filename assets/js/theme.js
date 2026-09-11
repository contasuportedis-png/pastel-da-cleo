/* Tema claro/escuro — roda cedo no <head> para evitar flash. Sem dependências. */
(function () {
  try {
    var t = null;
    try { t = localStorage.getItem('cleo_theme'); } catch (e) {}
    if (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
