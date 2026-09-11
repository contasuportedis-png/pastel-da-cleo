/* Pastel da Cléo — banco local (localStorage) expansível para backend futuro */
const DB_KEY='cleo_db_v1';
const DEFAULT_DB={
 settings:{
  nome:"Pastel da Cléo",
  endereco:"Av. Clelia Ceribelli de Assis Ferreira, 570 - Fraternidade, São José do Rio Preto - SP, 15082-145",
  enderecoCurto:"Av. Clelia Ceribelli de Assis Ferreira, 570, Fraternidade",
  cidade:"São José do Rio Preto – SP",
  telefone:"(17) 99215-4574",
  whatsapp:"5517992154574",
  instagram:"",
  descricao:"A Pastel da Cléo é uma pastelaria localizada em São José do Rio Preto, oferecendo uma variedade de pastéis salgados e doces, além de bebidas e opções para delivery e retirada.",
  historia:"Informação a configurar no painel administrativo.",
  mapsUrl:"https://www.google.com/maps/search/?api=1&query=Av.+Clelia+Ceribelli+de+Assis+Ferreira,+570+-+Fraternidade,+S%C3%A3o+Jos%C3%A9+do+Rio+Preto+-+SP,+15082-145",
  pedidoMinimo:0, tempoEstimado:"30 a 50 min"
 },
 hours:[
  {dia:"Domingo",open:"19:00",close:"23:00",fechado:false},
  {dia:"Segunda",open:"19:00",close:"23:00",fechado:true},
  {dia:"Terça",open:"19:00",close:"23:00",fechado:true},
  {dia:"Quarta",open:"19:00",close:"23:00",fechado:false},
  {dia:"Quinta",open:"19:00",close:"23:00",fechado:false},
  {dia:"Sexta",open:"19:00",close:"23:00",fechado:false},
  {dia:"Sábado",open:"19:00",close:"23:00",fechado:false}
 ],
 categories:[
  {id:"salgados",nome:"Pastéis Salgados",emoji:"🥟",ordem:1},
  {id:"gourmet",nome:"Especiais / Gourmet",emoji:"⭐",ordem:2},
  {id:"doces-pastel",nome:"Pastéis Doces",emoji:"🍫",ordem:3},
  {id:"vento",nome:"Pastel de Vento",emoji:"💨",ordem:4},
  {id:"bebidas",nome:"Bebidas",emoji:"🥤",ordem:5},
  {id:"doces",nome:"Doces",emoji:"🍰",ordem:6},
  {id:"combos",nome:"Combos & Promoções",emoji:"🎁",ordem:7}
 ],
 addons:[
  {id:"vinagrete",nome:"Vinagrete",preco:0,ativo:true},
  {id:"queijo-extra",nome:"Queijo extra",preco:4,ativo:true},
  {id:"requeijao-extra",nome:"Requeijão extra",preco:4,ativo:true},
  {id:"cheddar-extra",nome:"Cheddar extra",preco:5,ativo:true},
  {id:"cream-extra",nome:"Cream cheese extra",preco:5,ativo:true},
  {id:"recheio-extra",nome:"Recheio extra",preco:6,ativo:true}
 ],
 bairros:[
  {id:"fraternidade",nome:"Fraternidade",taxa:null,ativo:true},
  {id:"vila-toninho",nome:"Vila Toninho",taxa:null,ativo:true},
  {id:"santa-regina",nome:"Santa Regina",taxa:null,ativo:true},
  {id:"vila-nobre",nome:"Vila Nobre",taxa:null,ativo:true}
 ],
 products:[
  {id:"carne",nome:"Pastel de Carne",desc:"Carne temperada e preparada com muito sabor.",preco:20,categoria:"salgados",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:true,promo:false},
  {id:"carne-queijo",nome:"Pastel de Carne com Queijo",desc:"Carne temperada com queijo derretido.",preco:22,categoria:"salgados",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:true,promo:false},
  {id:"carne-requeijao",nome:"Pastel de Carne com Requeijão",desc:"Carne com requeijão cremoso.",preco:22,categoria:"salgados",img:"https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"carne-cream",nome:"Pastel de Carne com Cream Cheese",desc:"Carne com cream cheese.",preco:22,categoria:"salgados",img:"https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"carne-cheddar",nome:"Pastel de Carne com Cheddar",desc:"Carne com cheddar cremoso.",preco:22,categoria:"salgados",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"frango",nome:"Pastel de Frango",desc:"Frango desfiado bem temperado.",preco:18,categoria:"salgados",img:"https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:true,promo:false},
  {id:"frango-queijo",nome:"Pastel de Frango com Queijo",desc:"Frango com queijo derretido.",preco:20,categoria:"salgados",img:"https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:true,promo:false},
  {id:"frango-requeijao",nome:"Pastel de Frango com Requeijão",desc:"Frango com requeijão cremoso.",preco:20,categoria:"salgados",img:"https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"frango-cream",nome:"Pastel de Frango com Cream Cheese",desc:"Frango com cream cheese.",preco:20,categoria:"salgados",img:"https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"frango-cheddar",nome:"Pastel de Frango com Cheddar",desc:"Frango com cheddar.",preco:20,categoria:"salgados",img:"https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"pizza",nome:"Pastel de Pizza",desc:"Queijo, presunto, tomate e orégano.",preco:null,categoria:"salgados",img:"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"calabresa",nome:"Pastel de Calabresa",desc:"Calabresa com queijo.",preco:null,categoria:"salgados",img:"https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"palmito",nome:"Pastel de Palmito",desc:"Palmito cremoso.",preco:null,categoria:"salgados",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"costela",nome:"Pastel de Costela",desc:"Costela desfiada suculenta.",preco:null,categoria:"gourmet",img:"https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:true,promo:false},
  {id:"hotdog",nome:"Pastel Hot Dog",desc:"Salsicha, milho, batata palha e queijo.",preco:null,categoria:"salgados",img:"https://images.unsplash.com/photo-1612392062422-ef19b42f74df?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"vegetariano",nome:"Pastel Vegetariano",desc:"Legumes selecionados e queijo.",preco:null,categoria:"salgados",img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"gourmet1",nome:"Pastel Gourmet da Casa",desc:"Informação a configurar no painel administrativo.",preco:null,categoria:"gourmet",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"doce1",nome:"Pastel Doce (sabores)",desc:"Chocolate, doce de leite e outros. Consulte sabores do dia.",preco:null,categoria:"doces-pastel",img:"https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"vento",nome:"Pastel de Vento",desc:"Crocante, perfeito para acompanhar.",preco:null,categoria:"vento",img:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"refri",nome:"Refrigerante Lata",desc:"Coca-Cola, Guaraná e outros.",preco:null,categoria:"bebidas",img:"https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"suco",nome:"Suco Natural",desc:"Sabores variados, feito na hora.",preco:null,categoria:"bebidas",img:"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"agua",nome:"Água Mineral",desc:"Com ou sem gás.",preco:null,categoria:"bebidas",img:"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"cerveja",nome:"Cerveja",desc:"Consulte rótulos disponíveis.",preco:null,categoria:"bebidas",img:"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false},
  {id:"doce-sob",nome:"Doce / Sobremesa",desc:"Informação a configurar no painel administrativo.",preco:null,categoria:"doces",img:"https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80&auto=format&fit=crop",ativo:true,favorito:false,promo:false}
 ],
 reviews:[],
 promos:[],
 orders:[]
};
function loadDB(){try{const r=localStorage.getItem(DB_KEY);if(!r){const fresh=JSON.parse(JSON.stringify(DEFAULT_DB));try{localStorage.setItem(DB_KEY,JSON.stringify(fresh));}catch(e){}return fresh;}return validateDB(JSON.parse(r));}catch(e){return JSON.parse(JSON.stringify(DEFAULT_DB));}}
function saveDB(db){try{localStorage.setItem(DB_KEY,JSON.stringify(db));}catch(e){/* quota cheia: mantém em memória */}}

/* Valida e saneia tudo que vem do localStorage (anti-corrupção / anti-injeção).
   Qualquer campo inválido volta ao padrão — o site nunca quebra. */
function validateDB(d){
  const clean=JSON.parse(JSON.stringify(DEFAULT_DB));
  if(!d||typeof d!=='object'||Array.isArray(d))return clean;
  const S=(v,fb,max)=>typeof v==='string'?v.slice(0,max||300):fb;
  const B=(v,fb)=>typeof v==='boolean'?v:fb;
  const useSEC=typeof SEC!=='undefined';
  const saniStr=useSEC?SEC.str:(v,m)=>S(v,'',m||300);
  try{
    if(d.settings&&typeof d.settings==='object'){const s=d.settings,o=clean.settings;
      o.nome=saniStr(s.nome,80)||o.nome; o.endereco=saniStr(s.endereco,300)||o.endereco;
      o.enderecoCurto=saniStr(s.enderecoCurto,160)||o.enderecoCurto; o.cidade=saniStr(s.cidade,80)||o.cidade;
      o.telefone=saniStr(s.telefone,25)||o.telefone;
      o.whatsapp=useSEC?(SEC.safeWa(s.whatsapp)||o.whatsapp):(/^\d{10,15}$/.test(String(s.whatsapp||''))?s.whatsapp:o.whatsapp);
      o.instagram=useSEC?(SEC.safeHttpUrl(s.instagram)||''):(/^https?:\/\//.test(String(s.instagram||''))?S(s.instagram,'',500):'');
      o.descricao=saniStr(s.descricao,2000)||o.descricao; o.historia=saniStr(s.historia,2000)||o.historia;
      o.mapsUrl=useSEC?(SEC.safeHttpUrl(s.mapsUrl)||o.mapsUrl):o.mapsUrl;
      o.pedidoMinimo=useSEC?SEC.num(s.pedidoMinimo,0,10000,0):0; o.tempoEstimado=saniStr(s.tempoEstimado,60)||o.tempoEstimado;
    }
    if(Array.isArray(d.hours)){clean.hours=DEFAULT_DB.hours.map((h0,i)=>{const h=d.hours[i]||{};
      return{dia:h0.dia,open:useSEC?SEC.safeTime(h.open,h0.open):h0.open,close:useSEC?SEC.safeTime(h.close,h0.close):h0.close,fechado:B(h.fechado,h0.fechado)};});}
    if(Array.isArray(d.categories)){const seen={};clean.categories=d.categories.filter(c=>c&&typeof c==='object'&&typeof c.id==='string'&&/^[a-z0-9-]{1,60}$/.test(c.id)&&!seen[c.id]&&(seen[c.id]=1)).slice(0,60).map((c,i)=>({id:c.id,nome:saniStr(c.nome,60)||c.id,emoji:saniStr(c.emoji,12)||'🍴',ordem:useSEC?SEC.num(c.ordem,0,9999,i):i}));
      if(!clean.categories.length)clean.categories=JSON.parse(JSON.stringify(DEFAULT_DB.categories));}
    const catIds={};clean.categories.forEach(c=>catIds[c.id]=1);
    if(Array.isArray(d.addons)){clean.addons=d.addons.filter(a=>a&&typeof a==='object').slice(0,100).map(a=>({id:typeof a.id==='string'?saniStr(a.id,60):'a'+Math.random().toString(36).slice(2),nome:saniStr(a.nome,60)||'Adicional',preco:useSEC?(SEC.price(a.preco)===null?0:SEC.price(a.preco)):0,ativo:B(a.ativo,true)}));}
    if(Array.isArray(d.bairros)){clean.bairros=d.bairros.filter(b=>b&&typeof b==='object').slice(0,100).map(b=>({id:typeof b.id==='string'?saniStr(b.id,60):'b'+Math.random().toString(36).slice(2),nome:saniStr(b.nome,60)||'Bairro',taxa:useSEC?SEC.price(b.taxa):null,ativo:B(b.ativo,true)}));}
    if(Array.isArray(d.products)){clean.products=d.products.filter(p=>p&&typeof p==='object'&&typeof p.nome==='string').slice(0,500).map(p=>({id:typeof p.id==='string'&&/^[A-Za-z0-9-]{1,80}$/.test(p.id)?p.id:'p'+Math.random().toString(36).slice(2),nome:saniStr(p.nome,80)||'Produto',desc:saniStr(p.desc,300),preco:useSEC?SEC.price(p.preco):null,categoria:catIds[p.categoria]?p.categoria:clean.categories[0].id,img:saniStr(p.img,2000),ativo:B(p.ativo,true),favorito:B(p.favorito,false),promo:B(p.promo,false)}));}
    if(Array.isArray(d.reviews)){clean.reviews=d.reviews.filter(r=>r&&typeof r==='object'&&typeof r.texto==='string').slice(0,100).map(r=>({nome:saniStr(r.nome,60)||'Cliente',texto:saniStr(r.texto,500),estrelas:useSEC?SEC.num(r.estrelas,1,5,5):5}));}
    if(Array.isArray(d.promos)){clean.promos=[];} // promos legadas ignoradas por segurança
    if(Array.isArray(d.orders)){clean.orders=d.orders.filter(o=>o&&typeof o==='object').slice(-200).map(o=>({id:saniStr(o.id,30),nome:saniStr(o.nome,80),tipo:o.tipo==='delivery'?'delivery':'retirada',pag:saniStr(o.pag,30),total:useSEC?SEC.num(o.total,0,1000000,0):0,fee:useSEC?SEC.num(o.fee,0,100000,0):0,status:saniStr(o.status,30)||'Novo',data:saniStr(o.data,40),cancelledAt:typeof o.cancelledAt==='string'?o.cancelledAt.slice(0,40):null,itens:Array.isArray(o.itens)?o.itens.slice(0,50).map(i=>({nome:saniStr(i.nome,80),qty:useSEC?SEC.num(i.qty,1,99,1):1,sub:useSEC?SEC.num(i.sub,0,100000,0):0})):[]}));}
  }catch(e){return clean;}
  return clean;
}
function money(v){if(v==null||v===""||isNaN(Number(v)))return"a configurar";return Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
