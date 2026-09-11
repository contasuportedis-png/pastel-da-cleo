/* ============================================================
   Pastel da Cléo — backend (Node 24+, zero dependências)
   - Serve o site estático + API JSON + SQLite (data/cleo.db)
   - Auth real: scrypt + sessões HttpOnly + rate limit
   Uso: npm start  (ou: node server.mjs / PORT=3000 node server.mjs)
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.CLEO_DB || path.join(DATA_DIR, 'cleo.db');
if (process.env.CLEO_DB) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL;');

/* ---------------- schema ---------------- */
db.exec(`
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, nome TEXT, emoji TEXT, ordem REAL);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, nome TEXT, descr TEXT, preco REAL, categoria TEXT, img TEXT, ativo INTEGER, favorito INTEGER, promo INTEGER);
CREATE TABLE IF NOT EXISTS addons (id TEXT PRIMARY KEY, nome TEXT, preco REAL, ativo INTEGER);
CREATE TABLE IF NOT EXISTS bairros (id TEXT PRIMARY KEY, nome TEXT, taxa REAL, ativo INTEGER);
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, texto TEXT, estrelas INTEGER);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, nome TEXT, tipo TEXT, pag TEXT, total REAL, status TEXT, created_at TEXT, payload TEXT);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, salt TEXT, hash TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, created_at TEXT, expires_at TEXT);
`);

/* ---------------- seed inicial ---------------- */
const SEED = {
  settings: {
    nome: 'Pastel da Cléo',
    endereco: 'Av. Clelia Ceribelli de Assis Ferreira, 570 - Fraternidade, São José do Rio Preto - SP, 15082-145',
    enderecoCurto: 'Av. Clelia Ceribelli de Assis Ferreira, 570, Fraternidade',
    cidade: 'São José do Rio Preto – SP',
    telefone: '(17) 99215-4574',
    whatsapp: '5517992154574',
    instagram: '',
    descricao: 'A Pastel da Cléo é uma pastelaria localizada em São José do Rio Preto, oferecendo uma variedade de pastéis salgados e doces, além de bebidas e opções para delivery e retirada.',
    historia: 'Informação a configurar no painel administrativo.',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Clelia+Ceribelli+de+Assis+Ferreira,+570+-+Fraternidade,+S%C3%A3o+Jos%C3%A9+do+Rio+Preto+-+SP,+15082-145',
    pedidoMinimo: 0, tempoEstimado: '30 a 50 min'
  },
  hours: [
    { dia: 'Domingo', open: '19:00', close: '23:00', fechado: false },
    { dia: 'Segunda', open: '19:00', close: '23:00', fechado: true },
    { dia: 'Terça', open: '19:00', close: '23:00', fechado: true },
    { dia: 'Quarta', open: '19:00', close: '23:00', fechado: false },
    { dia: 'Quinta', open: '19:00', close: '23:00', fechado: false },
    { dia: 'Sexta', open: '19:00', close: '23:00', fechado: false },
    { dia: 'Sábado', open: '19:00', close: '23:00', fechado: false }
  ],
  categories: [
    { id: 'salgados', nome: 'Pastéis Salgados', emoji: '🥟', ordem: 1 },
    { id: 'gourmet', nome: 'Especiais / Gourmet', emoji: '⭐', ordem: 2 },
    { id: 'doces-pastel', nome: 'Pastéis Doces', emoji: '🍫', ordem: 3 },
    { id: 'vento', nome: 'Pastel de Vento', emoji: '💨', ordem: 4 },
    { id: 'bebidas', nome: 'Bebidas', emoji: '🥤', ordem: 5 },
    { id: 'doces', nome: 'Doces', emoji: '🍰', ordem: 6 },
    { id: 'combos', nome: 'Combos & Promoções', emoji: '🎁', ordem: 7 }
  ],
  addons: [
    { id: 'vinagrete', nome: 'Vinagrete', preco: 0, ativo: true },
    { id: 'queijo-extra', nome: 'Queijo extra', preco: 4, ativo: true },
    { id: 'requeijao-extra', nome: 'Requeijão extra', preco: 4, ativo: true },
    { id: 'cheddar-extra', nome: 'Cheddar extra', preco: 5, ativo: true },
    { id: 'cream-extra', nome: 'Cream cheese extra', preco: 5, ativo: true },
    { id: 'recheio-extra', nome: 'Recheio extra', preco: 6, ativo: true }
  ],
  bairros: [
    { id: 'fraternidade', nome: 'Fraternidade', taxa: null, ativo: true },
    { id: 'vila-toninho', nome: 'Vila Toninho', taxa: null, ativo: true },
    { id: 'santa-regina', nome: 'Santa Regina', taxa: null, ativo: true },
    { id: 'vila-nobre', nome: 'Vila Nobre', taxa: null, ativo: true }
  ],
  products: [
    { id: 'carne', nome: 'Pastel de Carne', desc: 'Carne temperada e preparada com muito sabor.', preco: 20, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: true },
    { id: 'carne-queijo', nome: 'Pastel de Carne com Queijo', desc: 'Carne temperada com queijo derretido.', preco: 22, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: true },
    { id: 'carne-requeijao', nome: 'Pastel de Carne com Requeijão', desc: 'Carne com requeijão cremoso.', preco: 22, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'carne-cream', nome: 'Pastel de Carne com Cream Cheese', desc: 'Carne com cream cheese.', preco: 22, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'carne-cheddar', nome: 'Pastel de Carne com Cheddar', desc: 'Carne com cheddar cremoso.', preco: 22, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'frango', nome: 'Pastel de Frango', desc: 'Frango desfiado bem temperado.', preco: 18, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: true },
    { id: 'frango-queijo', nome: 'Pastel de Frango com Queijo', desc: 'Frango com queijo derretido.', preco: 20, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: true },
    { id: 'frango-requeijao', nome: 'Pastel de Frango com Requeijão', desc: 'Frango com requeijão cremoso.', preco: 20, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'frango-cream', nome: 'Pastel de Frango com Cream Cheese', desc: 'Frango com cream cheese.', preco: 20, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'frango-cheddar', nome: 'Pastel de Frango com Cheddar', desc: 'Frango com cheddar.', preco: 20, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'pizza', nome: 'Pastel de Pizza', desc: 'Queijo, presunto, tomate e orégano.', preco: null, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'calabresa', nome: 'Pastel de Calabresa', desc: 'Calabresa com queijo.', preco: null, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'palmito', nome: 'Pastel de Palmito', desc: 'Palmito cremoso.', preco: null, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'costela', nome: 'Pastel de Costela', desc: 'Costela desfiada suculenta.', preco: null, categoria: 'gourmet', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: true },
    { id: 'hotdog', nome: 'Pastel Hot Dog', desc: 'Salsicha, milho, batata palha e queijo.', preco: null, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1612392062422-ef19b42f74df?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'vegetariano', nome: 'Pastel Vegetariano', desc: 'Legumes selecionados e queijo.', preco: null, categoria: 'salgados', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'gourmet1', nome: 'Pastel Gourmet da Casa', desc: 'Informação a configurar no painel administrativo.', preco: null, categoria: 'gourmet', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'doce1', nome: 'Pastel Doce (sabores)', desc: 'Chocolate, doce de leite e outros. Consulte sabores do dia.', preco: null, categoria: 'doces-pastel', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'vento', nome: 'Pastel de Vento', desc: 'Crocante, perfeito para acompanhar.', preco: null, categoria: 'vento', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'refri', nome: 'Refrigerante Lata', desc: 'Coca-Cola, Guaraná e outros.', preco: null, categoria: 'bebidas', img: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'suco', nome: 'Suco Natural', desc: 'Sabores variados, feito na hora.', preco: null, categoria: 'bebidas', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'agua', nome: 'Água Mineral', desc: 'Com ou sem gás.', preco: null, categoria: 'bebidas', img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'cerveja', nome: 'Cerveja', desc: 'Consulte rótulos disponíveis.', preco: null, categoria: 'bebidas', img: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false },
    { id: 'doce-sob', nome: 'Doce / Sobremesa', desc: 'Informação a configurar no painel administrativo.', preco: null, categoria: 'doces', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80&auto=format&fit=crop', ativo: true, favorito: false }
  ]
};

function kvGet(k) { const r = db.prepare('SELECT value FROM kv WHERE key=?').get(k); return r ? JSON.parse(r.value) : null; }
function kvSet(k, v) { db.prepare('INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, JSON.stringify(v)); }
function seedIfEmpty() {
  if (kvGet('settings')) return;
  kvSet('settings', SEED.settings);
  kvSet('hours', SEED.hours);
  const ic = db.prepare('INSERT INTO categories(id,nome,emoji,ordem) VALUES(?,?,?,?)');
  for (const c of SEED.categories) ic.run(c.id, c.nome, c.emoji, c.ordem);
  const ip = db.prepare('INSERT INTO products(id,nome,descr,preco,categoria,img,ativo,favorito,promo) VALUES(?,?,?,?,?,?,?,?,?)');
  for (const p of SEED.products) ip.run(p.id, p.nome, p.desc, p.preco, p.categoria, p.img, p.ativo ? 1 : 0, p.favorito ? 1 : 0, 0);
  const ia = db.prepare('INSERT INTO addons(id,nome,preco,ativo) VALUES(?,?,?,?)');
  for (const a of SEED.addons) ia.run(a.id, a.nome, a.preco, a.ativo ? 1 : 0);
  const ib = db.prepare('INSERT INTO bairros(id,nome,taxa,ativo) VALUES(?,?,?,?)');
  for (const b of SEED.bairros) ib.run(b.id, b.nome, b.taxa, b.ativo ? 1 : 0);
}
seedIfEmpty();

/* ---------------- saneamento (espelha assets/js/security.js) ---------------- */
const sstr = (v, max, fb = '') => typeof v === 'string' ? v.replace(/[ --]/g, '').trim().slice(0, max) : fb;
const snum = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const sprice = v => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return (Number.isFinite(n) && n >= 0 && n <= 100000) ? Math.round(n * 100) / 100 : null; };
const sslug = s => (typeof s === 'string' && /^[a-z0-9-]{1,60}$/.test(s)) ? s : null;
const stime = (v, fb) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v || '') ? v : fb);
const swa = v => { const d = String(v || '').replace(/\D/g, '').slice(0, 15); return d.length >= 10 ? d : null; };
const surl = v => { const s = sstr(v, 500); return (/^https?:\/\/[^\s"'<>\\]+$/i.test(s) ? s : ''); };
const sbool = (v, fb) => (typeof v === 'boolean' ? v : fb);
const ORDER_STATUS = ['Novo', 'Confirmado', 'Preparando', 'Pronto', 'Saiu para entrega', 'Entregue', 'Cancelado'];
const PAY_METHODS = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito'];
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/* Horário de SP puro (exportado p/ testes). weekdayShort: 'Sun'..'Sat' (Intl en-US). */
export function isOpenAt(hours, weekdayShort, mins) {
  const dm = { Sun: 'Domingo', Mon: 'Segunda', Tue: 'Terça', Wed: 'Quarta', Thu: 'Quinta', Fri: 'Sexta', Sat: 'Sábado' };
  const h = Array.isArray(hours) ? hours.find(x => x && x.dia === dm[weekdayShort]) : null;
  if (!h || h.fechado) return false;
  const t = (s, fb) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(s || '') ? s : fb);
  const [oh, om] = t(h.open, '00:00').split(':').map(Number), [ch, cm] = t(h.close, '00:00').split(':').map(Number);
  return mins >= (oh * 60 + om) && mins < (ch * 60 + cm);
}
function storeOpenNow() {
  if (process.env.CLEO_ALWAYS_OPEN) return true;
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const mins = Number(p.hour) * 60 + Number(p.minute);
    if (!Number.isFinite(mins)) return true; // fail-open: nunca travar venda por erro
    return isOpenAt(kvGet('hours'), p.weekday, mins);
  } catch { return true; }
}

function sanitizeAdminData(b) {
  if (!b || typeof b !== 'object') throw err(400, 'Dados inválidos.');
  const out = {};
  // settings
  const s = b.settings || {};
  const wa = swa(s.whatsapp);
  if (s.whatsapp !== undefined && !wa) throw err(400, 'WhatsApp inválido.');
  out.settings = {
    nome: sstr(s.nome, 80, 'Pastel da Cléo') || 'Pastel da Cléo',
    endereco: sstr(s.endereco, 300) || kvGet('settings').endereco,
    enderecoCurto: sstr(s.enderecoCurto, 160),
    cidade: sstr(s.cidade, 80),
    telefone: sstr(s.telefone, 25),
    whatsapp: wa || kvGet('settings').whatsapp,
    instagram: surl(s.instagram),
    descricao: sstr(s.descricao, 2000),
    historia: sstr(s.historia, 2000),
    mapsUrl: surl(s.mapsUrl) || kvGet('settings').mapsUrl,
    pedidoMinimo: snum(s.pedidoMinimo, 0, 10000, 0),
    tempoEstimado: sstr(s.tempoEstimado, 60)
  };
  // hours (pareado pelos dias canônicos)
  if (!Array.isArray(b.hours) || b.hours.length !== 7) throw err(400, 'Horários inválidos.');
  out.hours = b.hours.map((h, i) => ({
    dia: DAY_NAMES[i],
    open: stime(h && h.open, '19:00'),
    close: stime(h && h.close, '23:00'),
    fechado: sbool(h && h.fechado, false)
  }));
  // categories
  if (!Array.isArray(b.categories) || !b.categories.length || b.categories.length > 60) throw err(400, 'Categorias inválidas.');
  const seen = new Set();
  out.categories = b.categories.map((c, i) => {
    const id = sslug(c && c.id);
    if (!id || seen.has(id)) throw err(400, 'Categoria inválida/duplicada.');
    seen.add(id);
    return { id, nome: sstr(c.nome, 60) || id, emoji: sstr(c.emoji, 12) || '🍴', ordem: snum(c.ordem, 0, 9999, i) };
  });
  const catIds = new Set(out.categories.map(c => c.id));
  // products
  if (!Array.isArray(b.products) || b.products.length > 500) throw err(400, 'Produtos inválidos.');
  const pseen = new Set();
  out.products = b.products.map(p => {
    const id = (typeof p.id === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(p.id)) ? p.id : null;
    if (!id || pseen.has(id)) throw err(400, 'Produto inválido/duplicado.');
    pseen.add(id);
    return {
      id, nome: sstr(p.nome, 80) || 'Produto', descr: sstr(p.desc || p.descr, 300),
      preco: sprice(p.preco), categoria: catIds.has(p.categoria) ? p.categoria : out.categories[0].id,
      img: sstr(p.img, 2000), ativo: sbool(p.ativo, true), favorito: sbool(p.favorito, false), promo: sbool(p.promo, false)
    };
  });
  // addons / bairros
  if (!Array.isArray(b.addons) || b.addons.length > 100) throw err(400, 'Adicionais inválidos.');
  out.addons = b.addons.map(a => ({ id: sstr(a.id, 60) || ('a' + crypto.randomBytes(4).toString('hex')), nome: sstr(a.nome, 60) || 'Adicional', preco: sprice(a.preco) === null ? 0 : sprice(a.preco), ativo: sbool(a.ativo, true) }));
  if (!Array.isArray(b.bairros) || b.bairros.length > 100) throw err(400, 'Bairros inválidos.');
  out.bairros = b.bairros.map(x => ({ id: sstr(x.id, 60) || ('b' + crypto.randomBytes(4).toString('hex')), nome: sstr(x.nome, 60) || 'Bairro', taxa: sprice(x.taxa), ativo: sbool(x.ativo, true) }));
  // reviews
  if (!Array.isArray(b.reviews) || b.reviews.length > 100) throw err(400, 'Avaliações inválidas.');
  out.reviews = b.reviews.map(r => ({ nome: sstr(r.nome, 60) || 'Cliente', texto: sstr(r.texto, 500), estrelas: snum(r.estrelas, 1, 5, 5) | 0 }));
  return out;
}

function sanitizeOrder(b) {
  if (!b || typeof b !== 'object') throw err(400, 'Pedido inválido.');
  const rawItens = Array.isArray(b.itens) ? b.itens : [];
  if (!rawItens.length || rawItens.length > 50) throw err(400, 'Itens inválidos (1–50 por pedido).');
  const cleanItens = rawItens.map(i => {
    if (!i || typeof i !== 'object') throw err(400, 'Item inválido.');
    const q = Number(i.qty);
    if (!Number.isInteger(q) || q < 1 || q > 99) throw err(400, 'Quantidade inválida (1–99).');
    const sub = Number(i.sub);
    if (!Number.isFinite(sub) || sub < 0 || sub > 100000) throw err(400, 'Subtotal inválido.');
    const nome = sstr(i.nome, 80).replace(/[<>]/g, '');
    if (!nome) throw err(400, 'Item sem nome.');
    return {
      pid: (typeof i.pid === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(i.pid)) ? i.pid : null,
      nome, qty: q, sub: Math.round(sub * 100) / 100
    };
  });
  if (b.tipo !== 'delivery' && b.tipo !== 'retirada') throw err(400, 'Tipo inválido.');
  const tipo = b.tipo;
  const nome = sstr(b.nome, 80).replace(/[<>]/g, '');
  if (!nome) throw err(400, 'Nome obrigatório.');
  if (!PAY_METHODS.includes(b.pag)) throw err(400, 'Pagamento inválido.');
  const total = Number(b.total), fee = Number(b.fee);
  if (!Number.isFinite(total) || total < 0 || total > 100000) throw err(400, 'Total inválido.');
  if (!Number.isFinite(fee) || fee < 0 || fee > 1000) throw err(400, 'Taxa inválida.');
  const strip = v => sstr(v, 120).replace(/[<>]/g, '');
  const addr = { rua: strip(b.rua).slice(0, 120), numero: strip(b.numero).slice(0, 20), bairro: strip(b.bairro).slice(0, 80), compl: strip(b.compl).slice(0, 80), ref: sstr(b.ref, 120).replace(/[<>]/g, ''), trocoPara: sstr(b.trocoPara, 20) };
  if (tipo === 'delivery' && (!addr.rua || !addr.numero || !addr.bairro)) throw err(400, 'Endereço incompleto.');
  // consistência interna: total === Σ(sub) + fee (em centavos, sem erro de float)
  const sumSub = cleanItens.reduce((s, i) => s + i.sub, 0);
  if (Math.round(total * 100) !== Math.round((sumSub + fee) * 100)) throw err(400, 'Total incompatível com os itens.');
  // piso verificado: preços oficiais dos itens conhecidos (adicionais/taxa só aumentam, nunca diminuem)
  let floor = 0;
  const qProd = db.prepare('SELECT preco FROM products WHERE (id=? OR nome=?) AND ativo=1 LIMIT 1');
  for (const it of cleanItens) {
    const prod = qProd.get(it.pid || '', it.nome);
    if (prod && (prod.preco === null || prod.preco === undefined)) throw err(400, 'Item indisponível no momento.');
    if (prod && prod.preco !== null && prod.preco !== undefined) {
      const base = Number(prod.preco) * it.qty;
      if (it.sub + 0.009 < base) throw err(400, 'Subtotal abaixo do cardápio.');
      floor += base;
    }
  }
  if (total + 0.009 < floor) throw err(400, 'Total incompatível com o cardápio.');
  let id = (typeof b.id === 'string' && /^[A-Za-z0-9-]{1,30}$/.test(b.id)) ? b.id : ('PED-' + Date.now().toString(36).toUpperCase());
  const exists = db.prepare('SELECT 1 FROM orders WHERE id=?').get(id);
  if (exists) id = id + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
  return { id, nome, tipo, pag: b.pag, total: Math.round(total * 100) / 100, fee: Math.round(fee * 100) / 100, addr, itens: cleanItens };
}

/* ---------------- auth ---------------- */
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
function checkPw(pw, row) {
  try {
    const a = Buffer.from(hashPw(pw, Buffer.from(row.salt, 'hex')), 'hex');
    const c = Buffer.from(row.hash, 'hex');
    return a.length === c.length && crypto.timingSafeEqual(a, c);
  } catch { return false; }
}
function adminCount() { return db.prepare('SELECT COUNT(*) n FROM users').get().n; }
function newSession() {
  const tok = crypto.randomBytes(32).toString('hex');
  const th = crypto.createHash('sha256').update(tok).digest('hex');
  const now = new Date().toISOString();
  const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  db.prepare('INSERT INTO sessions(token_hash,created_at,expires_at) VALUES(?,?,?)').run(th, now, exp);
  return { tok, exp };
}
function getSession(req) {
  const m = /cleo_sess=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  if (!m) return null;
  const th = crypto.createHash('sha256').update(m[1]).digest('hex');
  const s = db.prepare('SELECT * FROM sessions WHERE token_hash=?').get(th);
  if (!s || s.expires_at < new Date().toISOString()) return null;
  db.prepare('UPDATE sessions SET expires_at=? WHERE token_hash=?').run(new Date(Date.now() + 8 * 3600 * 1000).toISOString(), th);
  return s;
}
function killSession(req) {
  const m = /cleo_sess=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  if (m) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(crypto.createHash('sha256').update(m[1]).digest('hex'));
}

/* ---------------- rate limit ---------------- */
const loginFails = new Map(); // ip -> {fails, until}
const orderHits = new Map();  // ip -> [ts]
const HOUR_MAX = Number(process.env.CLEO_HOUR_MAX) || 150; // teto/hora por IP (anti-flood; minuto continua 30)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginFails) if (v.until < now) loginFails.delete(k);
  for (const [k, arr] of orderHits) { const f = arr.filter(t => now - t < 3600000); f.length ? orderHits.set(k, f) : orderHits.delete(k); }
}, 60000).unref();
const ipOf = req => (req.socket.remoteAddress || 'x').replace(/^::ffff:/, '');

/* ---------------- http utils ---------------- */
function err(status, message) { const e = new Error(message); e.status = status; return e; }
function send(res, status, body, type = 'application/json; charset=utf-8') {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
  });
  res.end(data);
}
function parseBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(err(413, 'Corpo muito grande.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(err(400, 'JSON inválido.')); }
    });
    req.on('error', () => reject(err(400, 'Falha de leitura.')));
  });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
function serveStatic(req, res, pathname) {
  let p = pathname;
  if (p === '/' ) p = '/index.html';
  else if (p === '/admin') p = '/admin.html';
  const MAP = { '/index.html': 1, '/admin.html': 1, '/sitemap.xml': 1 };
  const isAsset = p.startsWith('/assets/');
  if (!MAP[p] && !isAsset) return false;
  const full = path.normalize(path.join(ROOT, p));
  if (!full.startsWith(ROOT + path.sep)) return send(res, 403, { error: 'Negado.' });
  fs.readFile(full, (e, data) => {
    if (e) return send(res, 404, { error: 'Não encontrado.' });
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(full)] || 'application/octet-stream',
      'Cache-Control': p.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    res.end(data);
  });
  return true;
}

/* ---------------- leituras ---------------- */
function readAll() {
  const settings = kvGet('settings'), hours = kvGet('hours');
  const q = (sql) => db.prepare(sql).all();
  return {
    settings, hours,
    categories: q('SELECT id,nome,emoji,ordem AS "ordem" FROM categories ORDER BY ordem'),
    products: q('SELECT id,nome,descr AS "desc",preco,categoria,img,ativo,favorito,promo FROM products').map(p => ({ ...p, ativo: !!p.ativo, favorito: !!p.favorito, promo: !!p.promo })),
    addons: q('SELECT * FROM addons').map(a => ({ ...a, ativo: !!a.ativo })),
    bairros: q('SELECT * FROM bairros').map(x => ({ ...x, ativo: !!x.ativo })),
    reviews: q('SELECT nome,texto,estrelas FROM reviews ORDER BY id')
  };
}
function readOrders() {
  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM orders WHERE status='Cancelado' AND json_extract(payload,'$.cancelledAt') IS NOT NULL AND json_extract(payload,'$.cancelledAt') < ?").run(cutoff);
  } catch {}
  return db.prepare('SELECT id,nome,tipo,pag,total,status,created_at AS data,payload FROM orders ORDER BY created_at DESC LIMIT 200').all()
    .map(o => {
      let pl = {};
      try { pl = JSON.parse(o.payload); } catch {}
      return { id: o.id, nome: o.nome, tipo: o.tipo, pag: o.pag, total: o.total, fee: Number(pl.fee) || 0, status: o.status, data: o.data, cancelledAt: typeof pl.cancelledAt === 'string' ? pl.cancelledAt : null, itens: Array.isArray(pl.itens) ? pl.itens : [] };
    });
}

/* ---------------- servidor ---------------- */
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const p = u.pathname;
    const ip = ipOf(req);

    if ((p === '/robots.txt' || p === '/.well-known/security.txt') && req.method === 'GET') {
      const txt = p === '/robots.txt'
        ? 'User-agent: *\nAllow: /\n'
        : 'Contact: https://pastel-da-cleo.onrender.com/#contato\nPreferred-Languages: pt-BR\n';
      return send(res, 200, txt, 'text/plain; charset=utf-8');
    }

    if (!p.startsWith('/api/')) {
      if (req.method !== 'GET') return send(res, 405, { error: 'Método não permitido.' });
      if (!serveStatic(req, res, p)) return send(res, 404, { error: 'Não encontrado.' });
      return;
    }

    /* públicas */
    if (p === '/api/health' && req.method === 'GET')
      return send(res, 200, { ok: true, api: true, setupNeeded: adminCount() === 0 });

    if (p === '/api/public' && req.method === 'GET') {
      const d = readAll();
      return send(res, 200, d);
    }

    if (p === '/api/orders' && req.method === 'POST') {
      if (!storeOpenNow()) return send(res, 403, { error: 'Estamos fechados no momento. Abrimos Qua a Dom, das 19h às 23h.' });
      const now = Date.now();
      const arr = (orderHits.get(ip) || []).filter(t => now - t < 3600000);
      if (arr.length >= HOUR_MAX) return send(res, 429, { error: 'Limite de pedidos por hora atingido.' });
      if (arr.filter(t => now - t < 60000).length >= 30) return send(res, 429, { error: 'Muitos pedidos. Aguarde um minuto.' });
      arr.push(now); orderHits.set(ip, arr);
      const o = sanitizeOrder(await parseBody(req, 64 * 1024));
      db.prepare('INSERT INTO orders(id,nome,tipo,pag,total,status,created_at,payload) VALUES(?,?,?,?,?,?,?,?)')
        .run(o.id, o.nome, o.tipo, o.pag, o.total, 'Novo', new Date().toISOString(), JSON.stringify({ itens: o.itens, addr: o.addr, fee: o.fee }));
      try {
        const MAX_ORDERS = Number(process.env.CLEO_MAX_ORDERS) || 500;
        db.prepare('DELETE FROM orders WHERE id NOT IN (SELECT id FROM orders ORDER BY created_at DESC LIMIT ?)').run(MAX_ORDERS);
      } catch {}
      return send(res, 201, { ok: true, id: o.id });
    }

    /* setup inicial (só sem admin) */
    if (p === '/api/admin/setup' && req.method === 'POST') {
      if (adminCount() > 0) return send(res, 403, { error: 'Já configurado.' });
      const b = await parseBody(req, 4096);
      const pw = typeof b.password === 'string' ? b.password : '';
      if (pw.length < 8 || pw.length > 100) return send(res, 400, { error: 'Senha: 8–100 caracteres.' });
      const salt = crypto.randomBytes(16);
      db.prepare('INSERT INTO users(salt,hash,created_at) VALUES(?,?,?)').run(salt.toString('hex'), hashPw(pw, salt), new Date().toISOString());
      const s = newSession();
      res.setHeader('Set-Cookie', `cleo_sess=${s.tok}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`);
      return send(res, 201, { ok: true });
    }

    if (p === '/api/admin/login' && req.method === 'POST') {
      const now = Date.now();
      const lf = loginFails.get(ip) || { fails: 0, until: 0 };
      if (lf.until > now) return send(res, 429, { error: 'Bloqueio temporário. Tente mais tarde.', retryIn: Math.ceil((lf.until - now) / 1000) });
      const b = await parseBody(req, 4096);
      const pw = typeof b.password === 'string' ? b.password : '';
      const user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
      const ok = user && pw.length <= 200 && checkPw(pw, user);
      // delay anti-enumeração
      await new Promise(r => setTimeout(r, ok ? 0 : 600));
      if (!ok) {
        lf.fails++;
        lf.until = lf.fails >= 5 ? now + Math.min(15 * 60 * 1000, Math.pow(2, lf.fails - 5) * 60 * 1000) : 0;
        loginFails.set(ip, lf);
        return send(res, 401, { error: 'Senha incorreta.' });
      }
      loginFails.delete(ip);
      const s = newSession();
      res.setHeader('Set-Cookie', `cleo_sess=${s.tok}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`);
      return send(res, 200, { ok: true });
    }

    /* rotas protegidas */
    const sess = getSession(req);
    if (p === '/api/admin/logout' && req.method === 'POST') {
      killSession(req);
      res.setHeader('Set-Cookie', 'cleo_sess=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
      return send(res, 200, { ok: true });
    }
    if (!sess) return send(res, 401, { error: 'Não autenticado.' });

    if (p === '/api/admin/me' && req.method === 'GET') return send(res, 200, { ok: true });
    if (p === '/api/admin/data' && req.method === 'GET') return send(res, 200, { ...readAll(), orders: readOrders() });

    if (p === '/api/admin/data' && req.method === 'PUT') {
      const clean = sanitizeAdminData(await parseBody(req, 256 * 1024));
      db.exec('BEGIN');
      try {
        kvSet('settings', clean.settings); kvSet('hours', clean.hours);
        db.prepare('DELETE FROM categories').run();
        db.prepare('DELETE FROM products').run();
        db.prepare('DELETE FROM addons').run();
        db.prepare('DELETE FROM bairros').run();
        db.prepare('DELETE FROM reviews').run();
        const ic = db.prepare('INSERT INTO categories(id,nome,emoji,ordem) VALUES(?,?,?,?)');
        for (const c of clean.categories) ic.run(c.id, c.nome, c.emoji, c.ordem);
        const ip2 = db.prepare('INSERT INTO products(id,nome,descr,preco,categoria,img,ativo,favorito,promo) VALUES(?,?,?,?,?,?,?,?,?)');
        for (const x of clean.products) ip2.run(x.id, x.nome, x.descr, x.preco, x.categoria, x.img, x.ativo ? 1 : 0, x.favorito ? 1 : 0, x.promo ? 1 : 0);
        const ia = db.prepare('INSERT INTO addons(id,nome,preco,ativo) VALUES(?,?,?,?)');
        for (const a of clean.addons) ia.run(a.id, a.nome, a.preco, a.ativo ? 1 : 0);
        const ib = db.prepare('INSERT INTO bairros(id,nome,taxa,ativo) VALUES(?,?,?,?)');
        for (const x of clean.bairros) ib.run(x.id, x.nome, x.taxa, x.ativo ? 1 : 0);
        const ir = db.prepare('INSERT INTO reviews(nome,texto,estrelas) VALUES(?,?,?)');
        for (const r of clean.reviews) ir.run(r.nome, r.texto, r.estrelas);
        db.exec('COMMIT');
      } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
      return send(res, 200, { ok: true });
    }

    const mPatch = /^\/api\/admin\/orders\/([A-Za-z0-9-]{1,40})$/.exec(p);
    if (mPatch && req.method === 'PATCH') {
      const b = await parseBody(req, 1024);
      if (!ORDER_STATUS.includes(b.status)) return send(res, 400, { error: 'Status inválido.' });
      const row = db.prepare('SELECT payload FROM orders WHERE id=?').get(mPatch[1]);
      if (!row) return send(res, 404, { error: 'Pedido não encontrado.' });
      let pl = {};
      try { pl = JSON.parse(row.payload); } catch {}
      if (b.status === 'Cancelado') pl.cancelledAt = new Date().toISOString();
      else delete pl.cancelledAt;
      db.prepare('UPDATE orders SET status=?,payload=? WHERE id=?').run(b.status, JSON.stringify(pl), mPatch[1]);
      return send(res, 200, { ok: true });
    }

    const mDel = /^\/api\/admin\/orders\/([A-Za-z0-9-]{1,40})$/.exec(p);
    if (mDel && req.method === 'DELETE') {
      const r = db.prepare('DELETE FROM orders WHERE id=?').run(mDel[1]);
      if (!r.changes) return send(res, 404, { error: 'Pedido não encontrado.' });
      return send(res, 200, { ok: true });
    }

    if (p === '/api/admin/password' && req.method === 'POST') {
      const b = await parseBody(req, 4096);
      const user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get();
      if (!user || !checkPw(String(b.current || ''), user)) return send(res, 401, { error: 'Senha atual incorreta.' });
      const nw = String(b.new || '');
      if (nw.length < 8 || nw.length > 100) return send(res, 400, { error: 'Nova senha: 8–100 caracteres.' });
      const salt = crypto.randomBytes(16);
      db.prepare('UPDATE users SET salt=?,hash=? WHERE id=?').run(salt.toString('hex'), hashPw(nw, salt), user.id);
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: 'Não encontrado.' });
  } catch (e) {
    return send(res, e.status || 500, { error: e.status ? e.message : 'Erro interno.' });
  }
});

export function start(port = process.env.PORT || 3000) {
  server.listen(port, () => console.log(`[cleo] http://localhost:${port} — dados em data/cleo.db`));
  return server;
}
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) start();
