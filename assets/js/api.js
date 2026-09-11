/* Cliente do backend (modo API). Se o servidor não existir
   (ex: abrindo o arquivo direto), tudo cai para o modo local. */
window.API = (function () {
  'use strict';
  var available = false;
  async function req(method, path, body) {
    var r = await fetch(path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    var d = null;
    try { d = await r.json(); } catch (e) { d = {}; }
    return { status: r.status, data: d || {} };
  }
  async function init() {
    try {
      var r = await fetch('/api/health', { cache: 'no-store' });
      if (!r.ok) return { api: false };
      var d = await r.json();
      available = !!(d && d.api);
      return { api: available, setupNeeded: !!(d && d.setupNeeded) };
    } catch (e) { return { api: false }; }
  }
  return { req: req, init: init, isAvailable: function () { return available; } };
})();
