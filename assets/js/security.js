/* ============================================================
   Pastel da Cléo — camada de segurança (carregada antes de app/admin)
   - escape de HTML, validação de URLs, limites e saneamento
   - hash de senha com salt (SHA-256 via WebCrypto + fallback)
   Sem dependências externas.
   ============================================================ */
(function (global) {
  'use strict';

  var PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop';

  /** Escapa texto para uso seguro dentro de HTML. */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Texto saneado com limite de tamanho. */
  function str(v, max) {
    var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    if (typeof max === 'number' && max >= 0) s = s.slice(0, max);
    return s;
  }

  /** Número dentro de faixa; retorna `def` se inválido. */
  function num(v, min, max, def) {
    var n = Number(v);
    if (!isFinite(n)) return def;
    if (typeof min === 'number' && n < min) n = min;
    if (typeof max === 'number' && n > max) n = max;
    return n;
  }

  /** Preço válido (null = "a configurar") ou null. */
  function price(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(v);
    if (!isFinite(n) || n < 0 || n > 100000) return null;
    return Math.round(n * 100) / 100;
  }

  /** Slug seguro para ids usados em HTML/JS: [a-z0-9-]. */
  function slugOk(s) {
    return typeof s === 'string' && /^[a-z0-9-]{1,60}$/.test(s);
  }

  /** Gera slug a partir de texto livre (para novas categorias). */
  function toSlug(s) {
    return str(s, 60).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
  }

  /** URL de imagem segura: só https:// (ou data:image pequeno). */
  function safeImg(u) {
    var s = str(u, 2000);
    if (/^https:\/\/[^\s"'<>\\]+$/i.test(s)) return s;
    if (/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(s) && s.length < 150000) return s;
    return PLACEHOLDER_IMG;
  }

  /** URL http(s) válida ou '' (bloqueia javascript:, data:, etc). */
  function safeHttpUrl(u) {
    var s = str(u, 500);
    if (/^https?:\/\/[^\s"'<>\\]+$/i.test(s)) return s;
    return '';
  }

  /** WhatsApp: só dígitos, 10–15 chars. */
  function safeWa(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '').slice(0, 15);
    return d.length >= 10 ? d : '';
  }

  /** Horário HH:MM válido ou fallback. */
  function safeTime(v, fb) {
    return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fb;
  }

  /* ---------- hash de senha ---------- */

  function randomSalt(bytes) {
    bytes = bytes || 16;
    var out = '';
    try {
      var a = new Uint8Array(bytes);
      (global.crypto || {}).getRandomValues
        ? global.crypto.getRandomValues(a)
        : a.map(function () { return Math.floor(Math.random() * 256); });
      for (var i = 0; i < a.length; i++) out += ('0' + a[i].toString(16)).slice(-2);
      return out;
    } catch (e) {
      for (var j = 0; j < bytes; j++) out += ('0' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
      return out;
    }
  }

  /* cyrb53 — hash síncrono de fallback (quando WebCrypto indisponível) */
  function cyrb53(str_, seed) {
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (var i = 0; i < str_.length; i++) {
      var ch = str_.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  function stretchedFallback(salt, pw) {
    var h = salt + '::' + pw;
    for (var r = 0; r < 5000; r++) h = cyrb53(h + r, 0x9e3779b9);
    return 'fb1$' + h;
  }

  function bufToHex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += ('0' + b[i].toString(16)).slice(-2);
    return s;
  }

  /** Gera {salt, hash, algo}. Sempre assíncrona (uso com await). */
  async function hashPassword(pw) {
    var salt = randomSalt(16);
    try {
      if (global.crypto && global.crypto.subtle && global.isSecureContext !== false) {
        var rounds = 5, h = new TextEncoder().encode(salt + '::' + pw);
        for (var i = 0; i < rounds; i++) h = await global.crypto.subtle.digest('SHA-256', h);
        return { salt: salt, hash: 's256x5$' + bufToHex(h), algo: 'sha256x5' };
      }
    } catch (e) { /* cai para fallback */ }
    return { salt: salt, hash: stretchedFallback(salt, pw), algo: 'fallback' };
  }

  /** Confere senha contra credencial armazenada. Retorna Promise<boolean>. */
  async function verifyPassword(pw, cred) {
    if (!cred || !cred.salt || !cred.hash) return false;
    pw = String(pw == null ? '' : pw);
    if (!pw || pw.length > 200) return false;
    try {
      if (cred.algo === 'sha256x5' && global.crypto && global.crypto.subtle) {
        var h = new TextEncoder().encode(cred.salt + '::' + pw);
        for (var i = 0; i < 5; i++) h = await global.crypto.subtle.digest('SHA-256', h);
        var hex = bufToHex(h);
        var want = String(cred.hash).replace(/^s256x5\$/, '');
        if (hex.length !== want.length) return false;
        var diff = 0;
        for (var j = 0; j < hex.length; j++) diff |= hex.charCodeAt(j) ^ want.charCodeAt(j);
        return diff === 0;
      }
    } catch (e) { return false; }
    if (String(cred.hash).indexOf('fb1$') === 0) {
      return stretchedFallback(cred.salt, pw) === cred.hash;
    }
    return false;
  }

  global.SEC = {
    esc: esc, str: str, num: num, price: price,
    slugOk: slugOk, toSlug: toSlug,
    safeImg: safeImg, safeHttpUrl: safeHttpUrl, safeWa: safeWa, safeTime: safeTime,
    hashPassword: hashPassword, verifyPassword: verifyPassword,
    PLACEHOLDER_IMG: PLACEHOLDER_IMG
  };
})(typeof window !== 'undefined' ? window : globalThis);
